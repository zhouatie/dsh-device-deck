import { createElement as h, useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { apiJson, copyShotImage, postJson, shotUrl } from './api.js';
import { API, HEADER_HEIGHT, STRIP_HEIGHT } from './constants.js';
import { useCopy } from './i18n.js';
import { rememberLink, removeLink, saveStore, shared, toggleLinkPin, useShotVersion } from './store.js';
import { Icon, LinkHistory } from './ui.js';

export function IosPanel({ ctx, onClose }) {
  const t = useCopy(ctx);
  const [udid, setUdid] = useState(shared.serial || '');
  const [kind, setKind] = useState(shared.iosKind === 'simulator' ? 'simulator' : 'device');
  const [devices, setDevices] = useState([]);
  const [status, setStatus] = useState('starting');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [screen, setScreen] = useState({ width: 390, height: 844 });
  const [nonce, setNonce] = useState(0);
  const [offset, setOffset] = useState(shared.offset || { x: 0, y: 0 });
  const [frameWidth, setFrameWidth] = useState(320);
  const [shots, setShots] = useState([]);
  const shotVersion = useShotVersion();
  const [stripOpen, setStripOpen] = useState(false);
  const [previewShot, setPreviewShot] = useState(null);
  const [inputOpen, setInputOpen] = useState(false);
  const [text, setText] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [notice, setNotice] = useState('');
  const [ripple, setRipple] = useState(null);
  const [railTip, setRailTip] = useState(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const viewportRef = useRef(null);
  const pointerRef = useRef(null);
  const dragRef = useRef(null);
  const menuRef = useRef(null);
  const frameRef = useRef(null);
  const linkInputRef = useRef(null);

  const device = devices.find((item) => item.udid === udid);
  const deviceName = device?.name || udid || 'iPhone';

  useEffect(() => {
    if (!udid) return;
    shared.serial = udid;
    shared.platform = 'ios';
    shared.iosKind = kind;
    saveStore();
  }, [udid, kind]);

  useEffect(() => {
    setPreviewShot(null);
  }, [udid]);

  const refreshDevices = useCallback(async () => {
    try {
      const data = await apiJson('/inventory');
      const physical = (data?.ios?.devices?.items || []).map((item) => ({
        udid: item.udid,
        name: item.name,
        detail: [item.model, item.osVersion ? `iOS ${item.osVersion}` : '', '真机'].filter(Boolean).join(' · '),
        kind: 'device',
      }));
      const simulators = (data?.ios?.running || []).map((item) => ({
        udid: item.udid,
        name: item.name,
        detail: [item.version ? `iOS ${item.version}` : '', '模拟器'].filter(Boolean).join(' · '),
        kind: 'simulator',
      }));
      setDevices([...physical, ...simulators]);
    } catch {
      /* keep the previous list */
    }
  }, []);

  useEffect(() => {
    void refreshDevices();
  }, [refreshDevices]);

  const refreshShots = useCallback(async () => {
    if (!udid) {
      setShots([]);
      return;
    }
    try {
      const data = await apiJson(`/screenshots?serial=${encodeURIComponent(udid)}`);
      setShots(Array.isArray(data.items) ? data.items : []);
    } catch {
      /* history is best effort */
    }
  }, [udid]);

  useEffect(() => {
    void refreshShots();
  }, [refreshShots, shotVersion]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    const measure = () => {
      const height = frame.clientHeight;
      if (height <= 0) return;
      const usable = height - HEADER_HEIGHT - (stripOpen ? STRIP_HEIGHT : 0);
      if (usable <= 0) return;
      const aspect = screen.width / Math.max(1, screen.height);
      const maxWidth = Math.max(240, Math.min(520, window.innerWidth - 80));
      const next = Math.max(240, Math.min(maxWidth, Math.round(usable * aspect)));
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
  }, [screen.width, screen.height, stripOpen]);

  useEffect(() => {
    if (!udid) return undefined;
    let cancelled = false;
    setStatus('starting');
    setError('');
    setProgress(t.iosPreparing);
    const poll = window.setInterval(() => {
      void apiJson(`/ios/mirror/status?udid=${encodeURIComponent(udid)}`)
        .then((data) => {
          if (cancelled) return;
          if (data?.message) setProgress(data.message);
        })
        .catch(() => undefined);
    }, 1500);
    void postJson('/ios/mirror/start', { udid, kind })
      .then((data) => {
        if (cancelled) return;
        if (data?.screen?.width) setScreen({ width: data.screen.width, height: data.screen.height });
        setProgress('');
        setStatus('live');
      })
      .catch((startError) => {
        if (cancelled) return;
        setStatus('error');
        setError(startError.message);
      })
      .finally(() => window.clearInterval(poll));
    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, [udid, kind, nonce]);

  const ratioFromEvent = (clientX, clientY) => {
    const viewport = viewportRef.current;
    if (!viewport) return null;
    const rect = viewport.getBoundingClientRect();
    const x = (clientX - rect.left) / Math.max(1, rect.width);
    const y = (clientY - rect.top) / Math.max(1, rect.height);
    return { x, y, inside: x >= 0 && x <= 1 && y >= 0 && y <= 1 };
  };

  const sendAction = useCallback(async (action) => {
    if (!udid) return false;
    try {
      await postJson('/ios/action', { udid, kind, action });
      return true;
    } catch (actionError) {
      setNotice(actionError.message);
      return false;
    }
  }, [udid, kind]);

  const wheelRef = useRef({ timer: 0, dy: 0, x: 0.5, y: 0.5, busy: false });

  const flushWheel = useCallback(() => {
    const pending = wheelRef.current;
    if (pending.busy) return;
    const dy = pending.dy;
    pending.dy = 0;
    if (!dy || !udid) return;
    pending.busy = true;
    void postJson('/ios/action', {
      udid,
      kind,
      action: {
        type: 'scroll',
        ratioX: pending.x,
        ratioY: pending.y,
        scrollY: Math.max(-48, Math.min(48, -dy * 0.16)),
      },
    }).catch(() => undefined).finally(() => {
      pending.busy = false;
      if (pending.dy && !pending.timer) {
        pending.timer = window.setTimeout(() => {
          pending.timer = 0;
          flushWheel();
        }, 64);
      }
    });
  }, [udid, kind]);

  const handleWheel = useCallback((event) => {
    if (status !== 'live' || !udid) return;
    const ratio = ratioFromEvent(event.clientX, event.clientY);
    if (!ratio || !ratio.inside) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1;
    const pending = wheelRef.current;
    pending.dy += event.deltaY * unit;
    pending.x = ratio.x;
    pending.y = ratio.y;
    if (pending.timer) return;
    pending.timer = window.setTimeout(() => {
      pending.timer = 0;
      flushWheel();
    }, 160);
  }, [status, udid, flushWheel, ratioFromEvent]);

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
      void sendAction({ type: 'tap', ratioX: ratio.x, ratioY: ratio.y });
      return;
    }
    void sendAction({
      type: 'swipe',
      ratioX: start.x,
      ratioY: start.y,
      ratioEndX: ratio.x,
      ratioEndY: ratio.y,
      duration: Math.max(120, Math.min(1000, duration)),
    });
  };

  const selectShot = useCallback(async (shot) => {
    if (!shot) return;
    setPreviewShot(shot);
    if (shot.selected) return;
    try {
      await postJson('/screenshots/select', { path: shot.path });
      setShots((previous) => previous.map((item) => ({ ...item, selected: item.path === shot.path })));
    } catch (selectError) {
      setNotice(selectError.message);
    }
  }, []);

  const copyPreview = useCallback(async () => {
    if (!previewShot) return;
    try {
      await copyShotImage(previewShot.path);
      setNotice(t.copyShotDone);
    } catch (copyError) {
      setNotice(t.copyShotFailed.replace('{error}', copyError.message));
    }
  }, [previewShot, t]);

  const capture = async () => {
    if (!udid) return;
    try {
      const data = await postJson('/ios/screenshot', { udid, kind });
      setShots((previous) => [data.shot, ...previous.map((item) => ({ ...item, selected: false }))]);
      setStripOpen(true);
      setNotice(t.shotSaved);
    } catch (captureError) {
      setNotice(captureError.message);
    }
  };

  const stopMirror = async () => {
    try {
      await postJson('/ios/mirror/stop', { udid });
    } catch {
      /* the session may already be gone */
    }
    onClose();
  };

  const sendText = async () => {
    const value = text.trim();
    if (!value) return;
    setInputOpen(false);
    const sent = await sendAction({ type: 'text', text: value });
    if (sent) setText('');
  };

  const openUrl = async () => {
    const value = url.trim();
    if (!value) return;
    const opened = await sendAction({ type: 'openUrl', url: value });
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
    dragRef.current = { clientX: event.clientX, clientY: event.clientY, x: offset.x, y: offset.y };
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
    'data-disabled': options.disabled ? 'true' : 'false',
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

  const isCompact = frameWidth < 330;
  const isLive = status === 'live';

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
                ? h('div', { style: { padding: '8px 7px', color: '#a1a1aa', fontSize: '11.5px' } }, t.menuEmpty)
                : devices.map((item) => h('button', {
                    key: item.udid,
                    type: 'button',
                    className: 'dd-menu-item',
                    'data-active': item.udid === udid && item.kind === kind ? 'true' : 'false',
                    onClick: () => {
                      setSwitcherOpen(false);
                      setKind(item.kind);
                      setUdid(item.udid);
                    },
                  },
                    h(Icon, { name: 'phone', size: 12 }),
                    h('span', null, item.name),
                    h('em', null, item.detail || ''),
                  )),
            ),
          ),
          h('div', { className: 'dd-head-right' },
            h('span', { className: 'dd-status', 'data-status': isLive ? 'live' : status === 'error' ? 'error' : 'connecting', 'data-compact': isCompact ? 'true' : 'false' },
              h('span', { className: 'dd-dot' }),
              !isCompact && h('span', null, isLive ? t.iosReady : status === 'error' ? t.iosFailed : t.menuStarting),
            ),
            h('button', {
              type: 'button',
              className: 'dd-head-refresh',
              title: t.retry,
              'aria-label': t.retry,
              onClick: () => setNonce((value) => value + 1),
            }, h(Icon, { name: 'refresh', size: 12 })),
          ),
        ),
      ),

      h('div', { className: 'dd-body' },
        h('div', { className: 'dd-rail' },
          railButton(t.railBack, 'back', () => void sendAction({ type: 'back' }), { disabled: !isLive }),
          railButton(t.iosHome, 'home', () => void sendAction({ type: 'home' }), { disabled: !isLive }),
          railButton(t.railText, 'keyboard', () => {
            setInputOpen((value) => !value);
            setLinkOpen(false);
          }, { disabled: !isLive, active: inputOpen }),
          railButton(t.railLink, 'globe', () => {
            setLinkOpen((value) => !value);
            setInputOpen(false);
          }, { disabled: !isLive, active: linkOpen }),
          h('div', { className: 'dd-rail-sep' }),
          shots.length > 0 && railButton(t.railHistory, 'history', () => setStripOpen((value) => !value), { active: stripOpen }),
          railButton(t.railCapture, 'camera', () => void capture(), { disabled: !isLive }),
          h('div', { className: 'dd-rail-sep' }),
          railButton(t.railClose, 'minimize', onClose),
          railButton(t.iosStop, 'power', () => void stopMirror(), { disabled: !udid }),
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
          isLive && h('img', {
            className: 'dd-canvas',
            key: `${udid}-${nonce}`,
            src: `${API}/ios/stream?udid=${encodeURIComponent(udid)}&kind=${kind}&_=${nonce}`,
            alt: deviceName,
            draggable: false,
            onError: () => {
              setStatus('error');
              setError(t.streamError);
            },
          }),

          ripple && h('span', {
            className: 'dd-ripple',
            style: { left: `${ripple.left}px`, top: `${ripple.top}px` },
          }),

          !udid && h('div', { className: 'dd-overlay' },
            h(Icon, { name: 'alert', size: 20 }),
            h('strong', null, t.menuEmpty),
            h('p', null, t.menuEmptyHint),
          ),

          udid && status === 'starting' && h('div', { className: 'dd-overlay' },
            h('span', { className: 'dd-spinner' }),
            h('span', null, progress || t.iosStarting),
            h('p', null, t.menuIosWdaHint),
          ),

          udid && status === 'error' && h('div', { className: 'dd-overlay' },
            h(Icon, { name: 'alert', size: 20 }),
            h('strong', null, t.iosFailed),
            h('p', null, error || t.menuIosWdaHint),
            h('button', {
              type: 'button',
              className: 'dd-btn',
              onClick: () => setNonce((value) => value + 1),
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
        h('div', { className: 'dd-pop-head-actions' },
          h('kbd', { className: 'dd-kbd' }, t.sendShortcut),
          h('button', { type: 'button', onClick: () => setInputOpen(false), title: t.close }, h(Icon, { name: 'close', size: 12 })),
        ),
      ),
      h('textarea', {
        'aria-keyshortcuts': 'Meta+Enter Control+Enter',
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
        h('button', { type: 'button', className: 'dd-send', disabled: !text.trim(), onClick: () => void sendText() }, t.sendText),
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
        h('button', { type: 'button', className: 'dd-send', disabled: !url.trim(), onClick: () => void openUrl() }, t.open),
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
