import { createElement as h, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { apiJson, copyShotImage, copyText, postJson, shotUrl } from './api.js';
import { API, HEADER_HEIGHT, STRIP_HEIGHT, T_CONFIG, T_DATA, T_END, T_ERROR, T_META } from './constants.js';
import { useCopy } from './i18n.js';
import { rememberLink, removeLink, saveStore, shared, toggleLinkPin } from './store.js';
import { avcCodecString, concatBytes, Icon, LinkHistory, statusLabel } from './ui.js';

export function Panel({ ctx, onClose }) {
  const t = useCopy(ctx);
  const [devices, setDevices] = useState([]);
  const [adb, setAdb] = useState(null);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [serial, setSerial] = useState(shared.serial || '');
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState('');
  const [videoSize, setVideoSize] = useState({ width: 1080, height: 2400 });
  const [shots, setShots] = useState([]);
  const [stripOpen, setStripOpen] = useState(false);
  const [previewShot, setPreviewShot] = useState(null);
  const [inputOpen, setInputOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [offset, setOffset] = useState(shared.offset || { x: 0, y: 0 });
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [ripple, setRipple] = useState(null);
  const [railTip, setRailTip] = useState(null);
  const [frameWidth, setFrameWidth] = useState(360);

  const canvasRef = useRef(null);
  const viewportRef = useRef(null);
  const ctx2dRef = useRef(null);
  const pointerRef = useRef(null);
  const retryRef = useRef(0);
  const dragRef = useRef(null);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  const frameRef = useRef(null);
  const linkInputRef = useRef(null);

  const device = devices.find((item) => item.serial === serial);
  const deviceName = device?.model || (serial ? serial : 'Android');
  const onlineDevices = devices.filter((item) => item.state === 'device');

  const flash = useCallback((message) => {
    setNotice(message);
  }, []);

  useEffect(() => {
    if (!notice || pushing) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 3200);
    return () => window.clearTimeout(timer);
  }, [notice, pushing]);

  useEffect(() => {
    if (!serial) return;
    shared.serial = serial;
    saveStore();
  }, [serial]);

  useEffect(() => {
    retryRef.current = 0;
    setPreviewShot(null);
  }, [serial]);

  const refreshDevices = useCallback(async () => {
    try {
      const data = await apiJson('/devices');
      setAdb(data.adb || null);
      const list = Array.isArray(data.devices) ? data.devices : [];
      setDevices(list);
      setSerial((previous) => {
        const online = list.filter((item) => item.state === 'device');
        if (previous && online.some((item) => item.serial === previous)) return previous;
        return online[0]?.serial || '';
      });
    } catch (fetchError) {
      setAdb({ available: false, error: fetchError.message });
      setDevices([]);
    } finally {
      setLoadingDevices(false);
    }
  }, []);

  useEffect(() => {
    void refreshDevices();
    const timer = window.setInterval(() => void refreshDevices(), 10_000);
    return () => window.clearInterval(timer);
  }, [refreshDevices]);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    const measure = () => {
      const height = frame.clientHeight;
      if (height <= 0) return;
      const usable = height - HEADER_HEIGHT - (stripOpen ? STRIP_HEIGHT : 0);
      if (usable <= 0) return;
      const aspect = videoSize.width / Math.max(1, videoSize.height);
      const maxWidth = Math.max(260, Math.min(520, window.innerWidth - 80));
      const next = Math.max(260, Math.min(maxWidth, Math.round(usable * aspect)));
      setFrameWidth((previous) => (Math.abs(previous - next) <= 1 ? previous : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [videoSize.width, videoSize.height, stripOpen]);

  const refreshShots = useCallback(async () => {
    if (!serial) {
      setShots([]);
      return;
    }
    try {
      const data = await apiJson(`/screenshots?serial=${encodeURIComponent(serial)}`);
      setShots(Array.isArray(data.items) ? data.items : []);
    } catch {
      /* history is best effort */
    }
  }, [serial]);

  useEffect(() => {
    void refreshShots();
  }, [refreshShots]);

  useEffect(() => {
    if (shots.length === 0) {
      setStripOpen(false);
      setRailTip(null);
      setPreviewShot(null);
    }
  }, [shots.length]);

  useEffect(() => {
    if (!switcherOpen) return undefined;
    const onPointerDown = (event) => {
      if (menuRef.current?.contains(event.target)) return;
      setSwitcherOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [switcherOpen]);

  useEffect(() => {
    if (!serial) {
      setStatus('offline');
      setError('');
      return undefined;
    }
    if (typeof VideoDecoder === 'undefined') {
      setStatus('error');
      setError('当前浏览器不支持 WebCodecs 视频解码。');
      return undefined;
    }

    const controller = new AbortController();
    let cancelled = false;
    let decoder = null;
    let configured = false;
    let pendingConfig = null;
    let firstFrame = false;
    let timestamp = 0;
    let metaSize = null;
    let retryResetTimer = null;
    const watchdog = window.setTimeout(() => {
      if (cancelled || firstFrame) return;
      setStatus('error');
      setError('长时间未收到画面数据。请确认设备在线。');
      controller.abort();
    }, 12_000);

    setStatus('connecting');
    setError('');

    const ensureDecoder = (codec, width, height) => {
      if (decoder !== null) return decoder;
      decoder = new VideoDecoder({
        output: (frame) => {
          if (cancelled) {
            frame.close();
            return;
          }
          const canvas = canvasRef.current;
          if (!canvas) {
            frame.close();
            return;
          }
          if (canvas.width !== frame.displayWidth || canvas.height !== frame.displayHeight) {
            canvas.width = frame.displayWidth;
            canvas.height = frame.displayHeight;
          }
          try {
            if (!ctx2dRef.current) {
              ctx2dRef.current = canvas.getContext('2d', { alpha: false, desynchronized: true });
            }
            ctx2dRef.current.drawImage(frame, 0, 0);
          } finally {
            frame.close();
          }
          if (!firstFrame) {
            firstFrame = true;
            window.clearTimeout(watchdog);
            retryResetTimer = window.setTimeout(() => {
              if (!cancelled) retryRef.current = 0;
            }, 10_000);
            setStatus('live');
            setError('');
            if (width && height && (width !== videoSize.width || height !== videoSize.height)) {
              setVideoSize({ width, height });
            }
          }
        },
        error: (decodeError) => {
          if (cancelled) return;
          setStatus('error');
          setError(`解码失败：${decodeError.message}`);
        },
      });
      return decoder;
    };

    const handleFrame = (type, flags, payload) => {
      if (cancelled) return;
      if (type === T_META) {
        try {
          const meta = JSON.parse(new TextDecoder().decode(payload));
          if (meta.width && meta.height) {
            metaSize = { width: meta.width, height: meta.height };
            setVideoSize({ width: meta.width, height: meta.height });
          }
          if (meta.codec !== 'h264') {
            setStatus('error');
            setError(`暂不支持 ${String(meta.codec).toUpperCase()} 视频编码。`);
            controller.abort();
          }
        } catch {
          /* ignore malformed metadata */
        }
        return;
      }
      if (type === T_CONFIG) {
        pendingConfig = payload.slice();
        try {
          const codec = avcCodecString(payload);
          const instance = ensureDecoder(codec, metaSize?.width, metaSize?.height);
          instance.configure({
            codec,
            optimizeForLatency: true,
            hardwareAcceleration: 'no-preference',
          });
          configured = true;
        } catch (configureError) {
          setStatus('error');
          setError(`解码器初始化失败：${configureError.message}`);
        }
        return;
      }
      if (type === T_DATA) {
        if (decoder === null || !configured) return;
        try {
          let data = payload;
          if (pendingConfig !== null) {
            data = concatBytes(pendingConfig, payload);
            pendingConfig = null;
          }
          timestamp += 1000;
          decoder.decode(new EncodedVideoChunk({
            type: (flags & 1) !== 0 ? 'key' : 'delta',
            timestamp,
            data,
          }));
        } catch {
          /* skip a frame the decoder cannot take */
        }
        return;
      }
      if (type === T_ERROR) {
        try {
          const info = JSON.parse(new TextDecoder().decode(payload));
          setStatus('error');
          setError(info?.message || t.streamError);
        } catch {
          setStatus('error');
          setError(t.streamError);
        }
        controller.abort();
        return;
      }
      if (type === T_END) {
        setStatus((previous) => (previous === 'live' ? 'offline' : previous));
      }
    };

    const readStream = async () => {
      try {
        const response = await fetch(
          `${API}/stream?serial=${encodeURIComponent(serial)}&_=${Date.now()}`,
          { signal: controller.signal, cache: 'no-store' },
        );
        if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
        const reader = response.body.getReader();
        let buffer = new Uint8Array(0);
        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer = concatBytes(buffer, value);
          let offsetInBuffer = 0;
          while (buffer.length - offsetInBuffer >= 6) {
            const type = buffer[offsetInBuffer];
            const flags = buffer[offsetInBuffer + 1];
            const length =
              (buffer[offsetInBuffer + 2] << 24) |
              (buffer[offsetInBuffer + 3] << 16) |
              (buffer[offsetInBuffer + 4] << 8) |
              buffer[offsetInBuffer + 5];
            if (buffer.length - offsetInBuffer - 6 < length) break;
            const payload = buffer.slice(offsetInBuffer + 6, offsetInBuffer + 6 + length);
            handleFrame(type, flags, payload);
            offsetInBuffer += 6 + length;
          }
          buffer = offsetInBuffer > 0 ? buffer.slice(offsetInBuffer) : buffer;
        }
        if (!cancelled) {
          const wasLive = firstFrame;
          setStatus((previous) => (previous === 'live' ? 'offline' : 'error'));
          setError(wasLive ? t.disconnected : t.streamError);
          if (wasLive && retryRef.current < 3) {
            retryRef.current += 1;
            window.setTimeout(() => {
              if (!cancelled) setNonce((value) => value + 1);
            }, 1200 * retryRef.current);
          }
        }
      } catch (streamError) {
        if (cancelled || controller.signal.aborted) return;
        setStatus('error');
        setError(streamError?.message || t.streamError);
        if (retryRef.current < 3) {
          retryRef.current += 1;
          window.setTimeout(() => {
            if (!cancelled) setNonce((value) => value + 1);
          }, 1200 * retryRef.current);
        }
      }
    };

    void readStream();

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(watchdog);
      if (retryResetTimer) window.clearTimeout(retryResetTimer);
      if (decoder !== null && decoder.state !== 'closed') {
        try {
          decoder.close();
        } catch {
          /* ignore */
        }
      }
      decoder = null;
      ctx2dRef.current = null;
      if (canvasRef.current) {
        canvasRef.current.width = 0;
        canvasRef.current.height = 0;
      }
    };
  }, [serial, nonce]);

  const ratioFromEvent = useCallback((clientX, clientY) => {
    const viewport = viewportRef.current;
    if (!viewport) return null;
    const rect = viewport.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const aspect = videoSize.width / videoSize.height;
    let width = rect.width;
    let height = rect.height;
    if (width / height > aspect) width = height * aspect;
    else height = width / aspect;
    const left = rect.left + (rect.width - width) / 2;
    const top = rect.top + (rect.height - height) / 2;
    const x = (clientX - left) / width;
    const y = (clientY - top) / height;
    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
      inside: x >= 0 && x <= 1 && y >= 0 && y <= 1,
      left,
      top,
      width,
      height,
    };
  }, [videoSize]);

  const runAction = useCallback(async (action) => {
    if (!serial) return false;
    setBusy(true);
    try {
      await postJson('/action', {
        serial,
        action: { ...action, frameWidth: videoSize.width, frameHeight: videoSize.height },
      });
      return true;
    } catch (actionError) {
      flash(actionError.message);
      return false;
    } finally {
      setBusy(false);
    }
  }, [serial, busy, videoSize, flash]);

  const wheelRef = useRef({ timer: 0, dx: 0, dy: 0, x: 0.5, y: 0.5, busy: false });

  const flushWheel = useCallback(() => {
    const pending = wheelRef.current;
    if (pending.busy) return;
    const dx = pending.dx;
    const dy = pending.dy;
    pending.dx = 0;
    pending.dy = 0;
    if ((!dx && !dy) || !serial) return;
    pending.busy = true;
    void postJson('/action', {
      serial,
      action: {
        type: 'scroll',
        ratioX: pending.x,
        ratioY: pending.y,
        scrollX: Math.max(-160, Math.min(160, dx * 0.16)),
        scrollY: Math.max(-160, Math.min(160, -dy * 0.16)),
        frameWidth: videoSize.width,
        frameHeight: videoSize.height,
      },
    }).catch(() => undefined).finally(() => {
      pending.busy = false;
      if ((pending.dx || pending.dy) && !pending.timer) {
        pending.timer = window.setTimeout(() => {
          pending.timer = 0;
          flushWheel();
        }, 32);
      }
    });
  }, [serial, videoSize]);

  const handleWheel = useCallback((event) => {
    if (status !== 'live' || !serial) return;
    const ratio = ratioFromEvent(event.clientX, event.clientY);
    if (!ratio || !ratio.inside) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1;
    const pending = wheelRef.current;
    pending.dx += event.deltaX * unit;
    pending.dy += event.deltaY * unit;
    pending.x = ratio.x;
    pending.y = ratio.y;
    if (pending.timer) return;
    pending.timer = window.setTimeout(() => {
      pending.timer = 0;
      flushWheel();
    }, 32);
  }, [status, serial, flushWheel, ratioFromEvent]);

  const wheelHandlerRef = useRef(handleWheel);
  wheelHandlerRef.current = handleWheel;

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;
    const listener = (event) => wheelHandlerRef.current(event);
    viewport.addEventListener('wheel', listener, { passive: false });
    return () => {
      viewport.removeEventListener('wheel', listener);
      const pending = wheelRef.current;
      if (pending.timer) window.clearTimeout(pending.timer);
      pending.timer = 0;
      pending.dx = 0;
      pending.dy = 0;
    };
  }, []);

  const handlePointerDown = (event) => {
    if (status !== 'live' || event.button === 2) return;
    const ratio = ratioFromEvent(event.clientX, event.clientY);
    if (!ratio || !ratio.inside) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointerRef.current = {
      x: ratio.x,
      y: ratio.y,
      clientX: event.clientX,
      clientY: event.clientY,
      time: Date.now(),
    };
  };

  const handlePointerUp = (event) => {
    const start = pointerRef.current;
    pointerRef.current = null;
    if (!start || status !== 'live') return;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const ratio = ratioFromEvent(event.clientX, event.clientY);
    if (!ratio) return;
    const dx = event.clientX - start.clientX;
    const dy = event.clientY - start.clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const duration = Date.now() - start.time;

    if (distance < 12 && duration < 400) {
      const viewport = viewportRef.current;
      if (viewport) {
        const rect = viewport.getBoundingClientRect();
        const id = Date.now();
        setRipple({ left: event.clientX - rect.left, top: event.clientY - rect.top, id });
        window.setTimeout(() => setRipple((current) => (current?.id === id ? null : current)), 280);
      }
      void runAction({ type: 'tap', ratioX: ratio.x, ratioY: ratio.y });
      return;
    }
    void runAction({
      type: 'swipe',
      ratioX: start.x,
      ratioY: start.y,
      ratioEndX: ratio.x,
      ratioEndY: ratio.y,
      duration: Math.max(120, Math.min(1000, duration)),
    });
  };

  const capture = useCallback(async () => {
    if (!serial || busy) return;
    setBusy(true);
    try {
      const data = await postJson('/screenshot', { serial });
      setShots((previous) => [data.shot, ...previous.map((item) => ({ ...item, selected: false }))]);
      setStripOpen(true);
      flash(t.shotSaved);
    } catch (captureError) {
      flash(captureError.message);
    } finally {
      setBusy(false);
    }
  }, [serial, busy, flash, t]);

  const copyPageAddress = useCallback(async () => {
    if (!serial) return;
    try {
      const data = await apiJson(`/page-address?serial=${encodeURIComponent(serial)}`);
      const address = String(data?.address || '').trim();
      if (!address) throw new Error(t.copyPageEmpty);
      try {
        await postJson('/clipboard', { text: address });
      } catch (hostError) {
        if (/HTTP 404/.test(hostError.message)) throw hostError;
        await copyText(address, t.copyPageDenied);
      }
      flash(t.copyPageDone);
    } catch (copyError) {
      flash(t.copyPageFailed.replace('{error}', copyError.message));
    }
  }, [serial, flash, t]);

  const pushFile = useCallback(async (file) => {
    if (!file || !serial || pushing) return;
    setPushing(true);
    flash(t.fileSending.replace('{name}', file.name));
    try {
      const response = await fetch(`${API}/file-push?serial=${encodeURIComponent(serial)}&name=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: file,
        cache: 'no-store',
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.error || `HTTP ${response.status}`);
      flash(t.fileSent.replace('{path}', data.path || file.name));
    } catch (error) {
      flash(t.fileFailed.replace('{error}', error.message));
    } finally {
      setPushing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [serial, pushing, flash, t]);

  const selectShot = useCallback(async (shot) => {
    if (!shot) return;
    setPreviewShot(shot);
    if (shot.selected) return;
    try {
      await postJson('/screenshots/select', { path: shot.path });
      setShots((previous) => previous.map((item) => ({ ...item, selected: item.path === shot.path })));
    } catch (selectError) {
      flash(selectError.message);
    }
  }, [flash]);

  const copyPreview = useCallback(async () => {
    if (!previewShot) return;
    try {
      await copyShotImage(previewShot.path);
      flash(t.copyShotDone);
    } catch (copyError) {
      flash(t.copyShotFailed.replace('{error}', copyError.message));
    }
  }, [previewShot, flash, t]);

  const sendText = async () => {
    const value = text.trim();
    if (!value || busy) return;
    setInputOpen(false);
    const sent = await runAction({ type: 'text', text: value });
    if (sent) setText((current) => (current === value ? '' : current));
  };

  const openUrl = async () => {
    const value = url.trim();
    if (!value || busy) return;
    const opened = await runAction({ type: 'openUrl', url: value });
    if (!opened) return;
    rememberLink(value);
    setUrl('');
    setLinkOpen(false);
  };

  const pickLink = (value) => {
    setUrl(value);
    linkInputRef.current?.focus();
  };

  const startDrag = (event) => {
    if (event.target.closest?.('button') || event.target.closest?.('input') || event.target.closest?.('textarea')) return;
    dragRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      x: offset.x,
      y: offset.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const moveDrag = (event) => {
    const drag = dragRef.current;
    if (!drag) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const nextX = Math.max(-width + 120, Math.min(width - 120, drag.x + event.clientX - drag.clientX));
    const nextY = Math.max(-80, Math.min(height - 120, drag.y + event.clientY - drag.clientY));
    setOffset({ x: nextX, y: nextY });
  };

  const endDrag = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    shared.offset = offset;
    saveStore();
  };

  const showRailTip = (label, element) => {
    const rect = element.getBoundingClientRect();
    setRailTip({
      label,
      top: Math.round(rect.top + rect.height / 2),
      right: Math.max(8, Math.round(window.innerWidth - rect.left + 8)),
    });
  };

  const railButton = (label, icon, action, options = {}) => h('button', {
    type: 'button',
    'aria-label': label,
    'aria-disabled': options.disabled ? 'true' : 'false',
    'data-disabled': options.disabled && !options.locked ? 'true' : 'false',
    'data-locked': options.locked ? 'true' : 'false',
    'data-active': options.active ? 'true' : 'false',
    onMouseEnter: (event) => showRailTip(label, event.currentTarget),
    onMouseLeave: () => setRailTip(null),
    onFocus: (event) => showRailTip(label, event.currentTarget),
    onBlur: () => setRailTip(null),
    onClick: () => {
      if (options.disabled) return;
      setRailTip(null);
      action();
    },
  }, h(Icon, { name: icon, size: 14 }));

  const statusText = statusLabel(t, status);
  const offline = status === 'error' || status === 'offline';
  const isCompact = frameWidth < 330;

  return h('div', {
    className: 'dd-panel',
    style: { transform: `translate(${offset.x}px, ${offset.y}px)` },
    role: 'dialog',
    'aria-label': t.title,
  },
    h('div', {
      ref: frameRef,
      className: 'dd-frame',
      style: {
        width: `${frameWidth}px`,
        ...(stripOpen ? { height: `calc(min(70vh, 840px) + ${STRIP_HEIGHT}px)` } : {}),
      },
    },
    h('div', {
      className: 'dd-head',
      onPointerDown: startDrag,
      onPointerMove: moveDrag,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
      h('div', { className: 'dd-head-left' },
        h('div', { ref: menuRef, style: { position: 'relative' } },
          h('button', {
            type: 'button',
            className: 'dd-device',
            title: t.switchDevice,
            'data-open': switcherOpen ? 'true' : 'false',
            onClick: () => setSwitcherOpen((value) => !value),
          },
            h(Icon, { name: 'phone', size: 13 }),
            h('span', { className: 'dd-device-name', style: { maxWidth: isCompact ? 150 : 240 } }, deviceName),
            h(Icon, { name: 'chevron', size: 10 }),
          ),
          switcherOpen && h('div', { className: 'dd-menu' },
            h('div', { className: 'dd-menu-title' }, t.switchDevice),
            devices.length === 0
              ? h('div', { style: { padding: '8px 7px', color: '#a1a1aa', fontSize: '11.5px' } }, t.noDevice)
              : devices.map((item) => h('button', {
                  key: item.serial,
                  type: 'button',
                  className: 'dd-menu-item',
                  'data-active': item.serial === serial ? 'true' : 'false',
                  disabled: item.state !== 'device',
                  onClick: () => {
                    setSwitcherOpen(false);
                    if (item.state !== 'device') return;
                    setSerial(item.serial);
                  },
                },
                  h(Icon, { name: 'phone', size: 12 }),
                  h('span', null, item.model || item.serial),
                  h('em', null, item.state === 'device' ? (item.isEmulator ? '模拟器' : '') : item.state),
                )),
          ),
        ),
        h('div', { className: 'dd-head-right' },
          h('span', { className: 'dd-status', 'data-status': status, 'data-compact': isCompact ? 'true' : 'false' },
            h('span', { className: 'dd-dot' }),
            !isCompact && h('span', null, statusText),
          ),
          h('button', {
            type: 'button',
            className: 'dd-head-refresh',
            title: t.railRefresh,
            'aria-label': t.railRefresh,
            onClick: () => {
              retryRef.current = 0;
              setNonce((value) => value + 1);
            },
          }, h(Icon, { name: 'refresh', size: 12 })),
        ),
      ),
    ),

    h('input', {
      ref: fileInputRef,
      type: 'file',
      style: { display: 'none' },
      onChange: (event) => {
        const file = event.target.files?.[0];
        if (file) void pushFile(file);
      },
    }),

    h('div', { className: 'dd-body' },
      h('div', { className: 'dd-rail' },
        railButton(t.railBack, 'back', () => void runAction({ type: 'key', key: 'back' }), { disabled: !serial || busy, locked: busy }),
        railButton(t.railHome, 'home', () => void runAction({ type: 'key', key: 'home' }), { disabled: !serial || busy, locked: busy }),
        railButton(t.railRecents, 'recents', () => void runAction({ type: 'key', key: 'recents' }), { disabled: !serial || busy, locked: busy }),
        railButton(t.railText, 'keyboard', () => {
          setInputOpen((value) => !value);
          setLinkOpen(false);
        }, { disabled: !serial, active: inputOpen }),
        railButton(t.railLink, 'globe', () => {
          setLinkOpen((value) => !value);
          setInputOpen(false);
        }, { disabled: !serial, active: linkOpen }),
        railButton(t.railFile, 'paperclip', () => fileInputRef.current?.click(), { disabled: !serial || pushing, locked: pushing }),
        railButton(t.railCopyPage, 'copy', () => void copyPageAddress(), { disabled: !serial || busy, locked: busy }),
        h('div', { className: 'dd-rail-sep' }),
        shots.length > 0 && railButton(t.railHistory, 'history', () => setStripOpen((value) => !value), { active: stripOpen }),
        railButton(t.railCapture, 'camera', () => void capture(), { disabled: !serial || busy, locked: busy }),
        h('div', { className: 'dd-rail-sep' }),
        railButton(t.railClose, 'minimize', onClose),
      ),

      h('div', {
        className: 'dd-viewport',
        ref: viewportRef,
        style: { borderRadius: stripOpen ? 0 : '0 0 10px 10px' },
        onPointerDown: handlePointerDown,
        onPointerUp: handlePointerUp,
        onPointerCancel: () => { pointerRef.current = null; },
        onContextMenu: (event) => event.preventDefault(),
      },
        h('canvas', { className: 'dd-canvas', ref: canvasRef }),

        ripple && h('span', {
          className: 'dd-ripple',
          style: { left: `${ripple.left}px`, top: `${ripple.top}px` },
        }),

        !serial && h('div', { className: 'dd-overlay' },
          h(Icon, { name: 'alert', size: 20 }),
          h('strong', null, adb?.available === false ? t.adbMissing : t.noDevice),
          h('p', null, adb?.available === false ? (adb.error || t.adbMissing) : t.noDeviceHint),
          h('button', {
            type: 'button',
            className: 'dd-btn',
            onClick: () => {
              setLoadingDevices(true);
              void refreshDevices();
            },
          }, h(Icon, { name: 'refresh', size: 12 }), t.refresh),
        ),

        serial && status === 'connecting' && h('div', { className: 'dd-overlay' },
          h('span', { className: 'dd-spinner' }),
          h('span', null, t.connectingHint),
        ),

        serial && offline && h('div', { className: 'dd-overlay' },
          h(Icon, { name: 'alert', size: 20 }),
          h('strong', null, status === 'offline' ? t.disconnected : t.streamError),
          h('p', null, error || t.noDeviceHint),
          h('button', {
            type: 'button',
            className: 'dd-btn',
            onClick: () => {
              retryRef.current = 0;
              setNonce((value) => value + 1);
            },
          }, h(Icon, { name: 'refresh', size: 12 }), t.retry),
        ),

        previewShot && h('div', {
          className: 'dd-preview',
          onPointerDown: (event) => event.stopPropagation(),
          onPointerUp: (event) => event.stopPropagation(),
          onPointerCancel: (event) => event.stopPropagation(),
        },
          h('img', { src: shotUrl(previewShot.path), alt: previewShot.name, draggable: false }),
          h('div', { className: 'dd-preview-actions' },
            h('button', {
              type: 'button',
              className: 'dd-preview-copy',
              title: t.previewCopy,
              'aria-label': t.previewCopy,
              onClick: () => void copyPreview(),
            }, h(Icon, { name: 'copy', size: 12 })),
            h('button', {
              type: 'button',
              className: 'dd-preview-close',
              title: t.previewClose,
              'aria-label': t.previewClose,
              onClick: () => setPreviewShot(null),
            }, h(Icon, { name: 'close', size: 12 })),
          ),
        ),
      ),
    ),

    stripOpen && h('div', { className: 'dd-strip' },
      h('span', { className: 'dd-strip-label' }, t.screenshotStrip),
      shots.length === 0
        ? h('span', { style: { color: '#71717a', fontSize: '10.5px' } }, t.emptyShot)
        : shots.map((shot) => h('button', {
            key: shot.path,
            type: 'button',
            className: 'dd-thumb',
            'data-selected': previewShot?.path === shot.path ? 'true' : 'false',
            title: previewShot?.path === shot.path ? t.selected : shot.name,
            onClick: () => void selectShot(shot),
          }, h('img', { src: shotUrl(shot.path), alt: shot.name, draggable: false }))),
    ),
    ),

    inputOpen && h('div', { className: 'dd-pop', style: { top: '46%' } },
      h('div', { className: 'dd-pop-head' },
        h('span', null, t.text),
        h('button', { type: 'button', onClick: () => setInputOpen(false), title: t.close }, h(Icon, { name: 'close', size: 12 })),
      ),
      h('textarea', {
        value: text,
        autoFocus: true,
        placeholder: t.enterText,
        onChange: (event) => setText(event.target.value),
        onKeyDown: (event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            void sendText();
          }
        },
      }),
      h('div', { className: 'dd-pop-foot' },
        h('span', { className: 'dd-pop-hint' }, t.textHint),
        h('button', { type: 'button', className: 'dd-send', disabled: !text.trim() || busy, onClick: () => void sendText() }, t.sendText),
      ),
    ),

    linkOpen && h('div', { className: 'dd-pop dd-pop-link', style: { top: '50%' } },
      h('div', { className: 'dd-pop-head' },
        h('span', null, t.link),
        h('button', { type: 'button', onClick: () => setLinkOpen(false), title: t.close }, h(Icon, { name: 'close', size: 12 })),
      ),
      h('textarea', {
        ref: linkInputRef,
        className: 'dd-pop-url',
        value: url,
        autoFocus: true,
        spellCheck: false,
        placeholder: t.urlHint,
        onChange: (event) => setUrl(event.target.value),
        onKeyDown: (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            void openUrl();
          }
        },
      }),
      h(LinkHistory, {
        t,
        onPick: pickLink,
        onTogglePin: toggleLinkPin,
        onRemove: removeLink,
      }),
      h('div', { className: 'dd-pop-foot' },
        h('span', { className: 'dd-pop-hint' }, t.enterUrl),
        h('button', { type: 'button', className: 'dd-send', disabled: !url.trim() || busy, onClick: () => void openUrl() }, t.open),
      ),
    ),

    notice && h('div', { className: 'dd-notice' }, notice),
    railTip && ReactDOM.createPortal(
      h('div', {
        className: 'dd-rail-tip',
        style: { top: `${railTip.top}px`, right: `${railTip.right}px` },
      }, railTip.label),
      document.body,
    ),
  );
}
