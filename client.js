window.__ModuleLoader__.load({
  id: 'dsh-device-deck',
  factory(require) {
    const React = require('react');
    const ReactDOM = require('react-dom');
    const h = React.createElement;
    const { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } = React;

    const API = '/api/device-deck';
    const STORE_KEY = ['dsh-device-deck', 'state', 'v1'].join('.');
    const T_META = 1;
    const T_CONFIG = 2;
    const T_DATA = 3;
    const T_ERROR = 4;
    const T_END = 5;
    const HEADER_HEIGHT = 36;
    const STRIP_HEIGHT = 50;

    const COPY = {
      zh: {
        title: '设备台',
        live: '实时',
        connecting: '连接中',
        offline: '离线',
        noDevice: '未检测到 Android 设备',
        noDeviceHint: '请连接 USB 并开启调试，或启动模拟器。',
        adbMissing: '未找到 adb',
        refresh: '刷新设备',
        capture: '截图',
        menuShot: '设备镜像截图',
        menuShotHint: '选择截图并加入输入框',
        pickerTitle: '选择截图',
        pickerHint: '点击截图加入当前输入框',
        pickerLoading: '正在读取截图…',
        pickerEmpty: '还没有截图。先在设备镜像中截图。',
        pickerLoadFailed: '读取截图失败：{error}',
        pickerAttachFailed: '加入失败：{error}',
        pickerBusy: '正在加入…',
        attachUnavailable: '当前输入框不可用',
        history: '截图历史',
        close: '收起',
        back: '返回键',
        home: '主屏幕',
        text: '文本输入',
        link: '打开链接',
        textHint: '英文、数字与常见符号；中文请用系统输入法。',
        sendText: '发送',
        open: '打开',
        urlHint: 'https://… 或 app://…',
        retry: '重新连接',
        streamError: '未能连接到设备实时画面',
        disconnected: '设备画面已断开',
        emptyShot: '还没有截图',
        selected: '已选定',
        shotSaved: '截图已保存',
        fileSending: '正在发送 {name}',
        fileSent: '已发送到 {path}',
        fileFailed: '发送失败：{error}',
        connectingHint: '正在连接设备画面…',
        switchDevice: '切换设备',
        screenshotStrip: '截图',
        enterText: '先在手机上点选输入框，再在此输入',
        enterUrl: '输入地址后回车',
        menuRunning: '运行中',
        menuNoOnline: '没有设备在线',
        menuReady: '已就绪',
        menuStarting: '启动中',
        menuEmulator: '模拟器',
        menuReal: '真机',
        menuIosEmulator: 'iOS 模拟器',
        menuNotStarted: '未启动 · 无窗口运行',
        menuAndroidEmulators: 'Android 模拟器',
        menuIosEmulators: 'iOS 模拟器',
        menuIosDevices: 'iOS 真机',
        menuIosMirrorOpen: '打开镜像',
        menuIosWdaHint: '首次启动需要构建 WebDriverAgent，约 2–5 分钟。',
        iosHome: '主屏幕',
        iosPreparing: '正在准备 iOS 镜像…',
        iosStarting: '正在启动 WebDriverAgent…',
        iosBuilding: '正在构建 WebDriverAgent…',
        iosReady: '已连接',
        iosFailed: 'iOS 镜像启动失败',
        iosStop: '停止镜像',
        menuShutdown: '已关机',
        menuStart: '启动',
        menuStartingBtn: '启动中',
        menuStop: '停止模拟器',
        menuOpenMirror: '打开镜像',
        menuOpenSimulator: '打开 Simulator',
        menuWifiPlaceholder: '192.168.1.102:5555',
        menuConnect: '连接',
        menuConnecting: '连接中',
        menuRefresh: '重新检测设备',
        menuAll: '全部',
        menuCollapse: '收起',
        menuEmpty: '没有可用模拟器',
        menuEmptyHint: '可连接无线 ADB 真机，或安装 Android AVD。',
        menuIosUnsupported: '已打开 Simulator；iOS 画面暂不支持镜像。',
        menuJustStarted: '刚刚启动',
        menuMinutes: '分',
        menuSeconds: '秒',
        menuHours: '小时',
        menuDeviceUnit: '台',
        menuItemUnit: '个',
        menuStartingWait: '模拟器正在启动，就绪后可打开镜像',
        menuStopRequested: '已请求停止',
        menuOnline: '台在线',
        menuNoDevice: '没有设备在线，点击启动模拟器',
        railBack: '返回',
        railHome: '主页',
        railRecents: '最近任务',
        railText: '输入',
        railLink: '链接',
        railFile: '文件',
        railHistory: '历史',
        railCapture: '截图',
        railRefresh: '重连',
        railClose: '收起',
      },
      en: {
        title: 'Device Deck',
        live: 'Live',
        connecting: 'Connecting',
        offline: 'Offline',
        noDevice: 'No Android device found',
        noDeviceHint: 'Connect USB with debugging on, or start an emulator.',
        adbMissing: 'adb not found',
        refresh: 'Refresh devices',
        capture: 'Screenshot',
        menuShot: 'Device screenshot',
        menuShotHint: 'Pick a screenshot and add it to the composer',
        pickerTitle: 'Choose a screenshot',
        pickerHint: 'Click a screenshot to add it to the composer',
        pickerLoading: 'Loading screenshots…',
        pickerEmpty: 'No screenshots yet. Capture one in the device mirror first.',
        pickerLoadFailed: 'Cannot load screenshots: {error}',
        pickerAttachFailed: 'Cannot add the screenshot: {error}',
        pickerBusy: 'Adding…',
        attachUnavailable: 'The composer is not available',
        history: 'Screenshot history',
        close: 'Minimize',
        back: 'Back',
        home: 'Home',
        text: 'Text input',
        link: 'Open link',
        textHint: 'ASCII only; use the device IME for other scripts.',
        sendText: 'Send',
        open: 'Open',
        urlHint: 'https://… or app://…',
        retry: 'Reconnect',
        streamError: 'Cannot connect to the device stream',
        disconnected: 'Device stream disconnected',
        emptyShot: 'No screenshots yet',
        selected: 'Selected',
        shotSaved: 'Screenshot saved',
        fileSending: 'Sending {name}',
        fileSent: 'Sent to {path}',
        fileFailed: 'Send failed: {error}',
        connectingHint: 'Connecting to the device…',
        switchDevice: 'Switch device',
        screenshotStrip: 'Shots',
        enterText: 'Focus a field on the device, then type here',
        enterUrl: 'Type a URL and press Enter',
        menuRunning: 'Running',
        menuNoOnline: 'No device online',
        menuReady: 'Ready',
        menuStarting: 'Starting',
        menuEmulator: 'Emulator',
        menuReal: 'Device',
        menuIosEmulator: 'iOS simulator',
        menuNotStarted: 'Stopped · headless',
        menuAndroidEmulators: 'Android emulators',
        menuIosEmulators: 'iOS simulators',
        menuIosDevices: 'iOS devices',
        menuIosMirrorOpen: 'Open mirror',
        menuIosWdaHint: 'The first launch builds WebDriverAgent and takes 2–5 minutes.',
        iosHome: 'Home',
        iosPreparing: 'Preparing the iOS mirror…',
        iosStarting: 'Starting WebDriverAgent…',
        iosBuilding: 'Building WebDriverAgent…',
        iosReady: 'Connected',
        iosFailed: 'Cannot start the iOS mirror',
        iosStop: 'Stop mirror',
        menuShutdown: 'Shutdown',
        menuStart: 'Start',
        menuStartingBtn: 'Starting',
        menuStop: 'Stop emulator',
        menuOpenMirror: 'Open mirror',
        menuOpenSimulator: 'Open Simulator',
        menuWifiPlaceholder: '192.168.1.102:5555',
        menuConnect: 'Connect',
        menuConnecting: 'Connecting',
        menuRefresh: 'Refresh devices',
        menuAll: 'All',
        menuCollapse: 'Collapse',
        menuEmpty: 'No simulator available',
        menuEmptyHint: 'Connect a wireless ADB device, or install an Android AVD.',
        menuIosUnsupported: 'Simulator opened; the iOS mirror is not supported yet.',
        menuJustStarted: 'just started',
        menuMinutes: 'min',
        menuSeconds: 's',
        menuHours: 'h',
        menuDeviceUnit: 'devices',
        menuItemUnit: 'AVDs',
        menuStartingWait: 'The emulator is starting; open the mirror once it is ready.',
        menuStopRequested: 'Stop requested',
        menuOnline: 'online',
        menuNoDevice: 'No device online. Click to start an emulator.',
        railBack: 'Back',
        railHome: 'Home',
        railRecents: 'Recents',
        railText: 'Text',
        railLink: 'Link',
        railFile: 'File',
        railHistory: 'History',
        railCapture: 'Screenshot',
        railRefresh: 'Reconnect',
        railClose: 'Close',
      },
    };

    function loadStore() {
      try {
        const raw = window.localStorage.getItem(STORE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        return {
          open: Boolean(parsed?.open),
          platform: parsed?.platform === 'ios' ? 'ios' : 'android',
          iosKind: parsed?.iosKind === 'simulator' ? 'simulator' : 'device',
          serial: typeof parsed?.serial === 'string' ? parsed.serial : '',
          offset: {
            x: Number.isFinite(parsed?.offset?.x) ? parsed.offset.x : 0,
            y: Number.isFinite(parsed?.offset?.y) ? parsed.offset.y : 0,
          },
        };
      } catch {
        return { open: false, platform: 'android', iosKind: 'device', serial: '', offset: { x: 0, y: 0 } };
      }
    }

    const shared = loadStore();
    const openListeners = new Set();

    function saveStore() {
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(shared));
      } catch {
        /* ignore */
      }
    }

    function setSharedOpen(next) {
      if (shared.open === next) return;
      shared.open = next;
      saveStore();
      for (const listener of openListeners) listener();
    }

    function notifyStore() {
      for (const listener of openListeners) listener();
    }

    function subscribeStore(listener) {
      openListeners.add(listener);
      return () => openListeners.delete(listener);
    }

    function useSharedOpen() {
      return useSyncExternalStore(subscribeStore, () => shared.open);
    }

    function useSharedPlatform() {
      return useSyncExternalStore(subscribeStore, () => shared.platform);
    }

    function currentCopy(ctx) {
      const active = ctx.locale?.getLocale?.().active || 'en';
      return String(active).toLowerCase().startsWith('zh') ? COPY.zh : COPY.en;
    }

    function useCopy(ctx) {
      const [copy, setCopy] = useState(() => currentCopy(ctx));
      useEffect(() => {
        if (!ctx.locale?.subscribe) return undefined;
        return ctx.locale.subscribe(() => setCopy(currentCopy(ctx)));
      }, [ctx]);
      return copy;
    }

    async function apiJson(path, init) {
      const response = await fetch(`${API}${path}`, {
        cache: 'no-store',
        ...init,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);
      return data;
    }

    function postJson(path, value) {
      return apiJson(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
      });
    }

    function shotUrl(shotPath) {
      return `${API}/file?path=${encodeURIComponent(shotPath)}`;
    }

    const shotPicker = {
      sessionId: null,
      listeners: new Set(),
    };

    function notifyShotPicker() {
      for (const listener of shotPicker.listeners) listener();
    }

    function openShotPicker(sessionId) {
      if (!sessionId) return;
      shotPicker.sessionId = sessionId;
      notifyShotPicker();
    }

    function closeShotPicker(sessionId) {
      if (sessionId !== undefined && shotPicker.sessionId !== sessionId) return;
      shotPicker.sessionId = null;
      notifyShotPicker();
    }

    function useShotPickerOpen(sessionId) {
      const [open, setOpen] = useState(shotPicker.sessionId === sessionId);
      useEffect(() => {
        const sync = () => setOpen(shotPicker.sessionId === sessionId);
        shotPicker.listeners.add(sync);
        sync();
        return () => {
          shotPicker.listeners.delete(sync);
          if (shotPicker.sessionId === sessionId) closeShotPicker(sessionId);
        };
      }, [sessionId]);
      return open;
    }

    async function attachShot(ctx, sessionId, inputActions, shot, t) {
      const conversation = ctx.conversation || ctx.get?.('conversation');
      if (!conversation?.createDrafts) throw new Error(t.attachUnavailable);
      const binding = ctx.sessions?.binding?.(sessionId);
      if (!binding) throw new Error(t.attachUnavailable);
      let actions = inputActions;
      if (!actions?.addAttachments) {
        try {
          actions = conversation.input?.for?.(binding.ctx)?.actions;
        } catch {
          /* fall through to the unavailable error */
        }
      }
      if (!actions?.addAttachments) throw new Error(t.attachUnavailable);
      const response = await fetch(shotUrl(shot.path), { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const file = new File([blob], shot.name || `device-shot-${Date.now()}.png`, { type: 'image/png' });
      const ordinary = binding.session.getSnapshot().subagent === null;
      const drafts = conversation.createDrafts(sessionId, [file], ordinary);
      if (!actions.addAttachments(drafts.map((draft) => draft.id))) {
        conversation.releaseDraftAttachments?.(drafts);
        throw new Error(t.attachUnavailable);
      }
      try {
        conversation.input?.for?.(binding.ctx)?.focus?.();
      } catch {
        /* focus is best-effort */
      }
    }

    function shotTimeText(at) {
      const date = new Date(at);
      if (Number.isNaN(date.getTime())) return '';
      return date.toLocaleString(undefined, {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    function ShotPicker({ ctx, sessionId, inputActions, onClose }) {
      const t = useCopy(ctx);
      const [shots, setShots] = useState([]);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState('');
      const [busy, setBusy] = useState('');

      useEffect(() => {
        let alive = true;
        apiJson('/screenshots')
          .then((data) => {
            if (alive) setShots(Array.isArray(data.items) ? data.items : []);
          })
          .catch((loadError) => {
            if (alive) setError(t.pickerLoadFailed.replace('{error}', loadError.message));
          })
          .finally(() => {
            if (alive) setLoading(false);
          });
        return () => {
          alive = false;
        };
      }, [t]);

      useEffect(() => {
        const onKeyDown = (event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
          }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
      }, [onClose]);

      const choose = async (shot) => {
        if (busy) return;
        setBusy(shot.path);
        setError('');
        try {
          await attachShot(ctx, sessionId, inputActions, shot, t);
          onClose();
        } catch (attachError) {
          setError(t.pickerAttachFailed.replace('{error}', attachError.message));
        } finally {
          setBusy('');
        }
      };

      return ReactDOM.createPortal(
        h('div', {
          className: 'dd-shot-mask',
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) onClose();
          },
        },
          h('div', {
            className: 'dd-shot-panel',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': t.pickerTitle,
          },
            h('div', { className: 'dd-shot-head' },
              h('div', { className: 'dd-shot-titles' },
                h('strong', null, t.pickerTitle),
                h('span', null, t.pickerHint),
              ),
              h('button', {
                type: 'button',
                className: 'dd-shot-close',
                title: t.close,
                'aria-label': t.close,
                onClick: onClose,
              }, h(Icon, { name: 'close', size: 12 })),
            ),

            loading
              ? h('div', { className: 'dd-shot-state' }, h('span', { className: 'dd-spinner' }), t.pickerLoading)
              : error && shots.length === 0
                ? h('div', { className: 'dd-shot-state' }, error)
                : shots.length === 0
                  ? h('div', { className: 'dd-shot-state' }, t.pickerEmpty)
                  : h(Fragment, null,
                      error && h('div', { className: 'dd-shot-error' }, error),
                      h('div', { className: 'dd-shot-grid' },
                        shots.map((shot) => h('button', {
                          key: shot.path,
                          type: 'button',
                          className: 'dd-shot-item',
                          'data-busy': busy === shot.path ? 'true' : 'false',
                          disabled: Boolean(busy),
                          title: new Date(shot.at).toLocaleString(),
                          onClick: () => void choose(shot),
                        },
                          h('img', { src: shotUrl(shot.path), alt: shot.name, draggable: false }),
                          h('span', { className: 'dd-shot-time' }, busy === shot.path ? t.pickerBusy : shotTimeText(shot.at)),
                        )),
                      ),
                    ),
          ),
        ),
        document.body,
      );
    }

    function concatBytes(left, right) {
      if (left.length === 0) return right;
      const out = new Uint8Array(left.length + right.length);
      out.set(left, 0);
      out.set(right, left.length);
      return out;
    }

    function avcCodecString(data) {
      let nal = -1;
      for (let index = 0; index + 3 < data.length; index += 1) {
        if (data[index] !== 0 || data[index + 1] !== 0) continue;
        if (data[index + 2] === 1) {
          nal = index + 3;
          break;
        }
        if (data[index + 2] === 0 && data[index + 3] === 1) {
          nal = index + 4;
          break;
        }
      }
      if (nal < 0 || nal + 3 >= data.length) return 'avc1.42E01E';
      const hex = (value) => Number(value || 0).toString(16).toUpperCase().padStart(2, '0');
      return `avc1.${hex(data[nal + 1])}${hex(data[nal + 2])}${hex(data[nal + 3])}`;
    }

    function statusLabel(t, status) {
      if (status === 'live') return t.live;
      if (status === 'connecting') return t.connecting;
      return t.offline;
    }

    function Icon({ name, size = 15 }) {
      const common = {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        style: { display: 'block' },
      };
      switch (name) {
        case 'phone':
          return h('svg', common, h('rect', { x: 6, y: 2.5, width: 12, height: 19, rx: 2.6 }), h('path', { d: 'M10 5.5h4' }), h('circle', { cx: 12, cy: 18.4, r: 0.7, fill: 'currentColor', stroke: 'none' }));
        case 'camera':
          return h('svg', common, h('path', { d: 'M3 8.5h3.2l1.4-2h8.8l1.4 2H21v11H3z' }), h('circle', { cx: 12, cy: 13.5, r: 3.4 }));
        case 'refresh':
          return h('svg', common, h('path', { d: 'M20 11a8 8 0 1 0-2.3 6.1' }), h('path', { d: 'M20 4v7h-7' }));
        case 'history':
          return h('svg', common,
            h('path', { d: 'M18 22H4a2 2 0 0 1-2-2V6' }),
            h('path', { d: 'm22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18' }),
            h('circle', { cx: 12, cy: 8, r: 2 }),
            h('rect', { x: 6, y: 2, width: 16, height: 16, rx: 2 }),
          );
        case 'close':
          return h('svg', common, h('path', { d: 'M6 6l12 12M18 6 6 18' }));
        case 'minimize':
          return h('svg', common, h('path', { d: 'M5 12h14' }));
        case 'back':
          return h('svg', common, h('path', { d: 'M15 5l-7 7 7 7' }));
        case 'home':
          return h('svg', common, h('path', { d: 'M4 11 12 4l8 7' }), h('path', { d: 'M6.5 10v9.5h11V10' }));
        case 'recents':
          return h('svg', common, h('rect', { x: 8, y: 3.5, width: 12.5, height: 12.5, rx: 2.2 }), h('rect', { x: 3.5, y: 8, width: 12.5, height: 12.5, rx: 2.2 }));
        case 'keyboard':
          return h('svg', common, h('rect', { x: 2.5, y: 6, width: 19, height: 12, rx: 2.2 }), h('path', { d: 'M6 10h1M10 10h1M14 10h1M18 10h.5M7 14h10' }));
        case 'link':
          return h('svg', common, h('path', { d: 'M10 14a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 1 0-5.7-5.7L11.5 6.8' }), h('path', { d: 'M14 10a4 4 0 0 0-5.7 0l-2.6 2.6a4 4 0 1 0 5.7 5.7l1.1-1.1' }));
        case 'paperclip':
          return h('svg', common, h('path', { d: 'm21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48' }));
        case 'chevron':
          return h('svg', common, h('path', { d: 'M6 9l6 6 6-6' }));
        case 'alert':
          return h('svg', common, h('path', { d: 'M12 3 2.5 20h19z' }), h('path', { d: 'M12 9v5M12 17.2v.1' }));
        case 'android':
          return h('svg', common, h('path', { d: 'M7 9h10v7.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 16.5z' }), h('path', { d: 'M9 9 7.5 5.5M15 9l1.5-3.5' }), h('path', { d: 'M5 10.5v5M19 10.5v5' }));
        case 'monitorplay':
          return h('svg', common, h('rect', { x: 3, y: 4, width: 18, height: 13, rx: 2 }), h('path', { d: 'M10 8.5l5 2.5-5 2.5z' }), h('path', { d: 'M12 17v3M9 20h6' }));
        case 'power':
          return h('svg', common, h('path', { d: 'M12 3v8' }), h('path', { d: 'M6.7 6.7a8 8 0 1 0 10.6 0' }));
        case 'wifi':
          return h('svg', common, h('path', { d: 'M3.5 9.5a13 13 0 0 1 17 0' }), h('path', { d: 'M6.5 13a8.5 8.5 0 0 1 11 0' }), h('path', { d: 'M9.5 16.5a4 4 0 0 1 5 0' }), h('circle', { cx: 12, cy: 19.5, r: 0.7, fill: 'currentColor', stroke: 'none' }));
        case 'play':
          return h('svg', common, h('path', { d: 'M8 5.5l10 6.5-10 6.5z' }));
        case 'external':
          return h('svg', common, h('path', { d: 'M14 4h6v6' }), h('path', { d: 'M20 4 11 13' }), h('path', { d: 'M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5' }));
        default:
          return null;
      }
    }

    function LauncherIcon({ size = 16 }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, style: { display: 'block' } },
        h('rect', { x: 6.5, y: 2.5, width: 11, height: 19, rx: 2.5 }),
        h('path', { d: 'M10.5 5.5h3' }),
        h('circle', { cx: 12, cy: 18.2, r: 0.6, fill: 'currentColor', stroke: 'none' }),
      );
    }

    const CSS = `
      .dd-launcher{position:relative;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;transition:background .15s ease,color .15s ease}
      .dd-launcher:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
      .dd-launcher[data-active="true"]{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
      .dd-launcher[data-count="true"]{width:auto;padding:0 4px;gap:3px}
      .dd-launcher-count{font-size:10px;font-weight:500;line-height:1;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
      .dd-launcher:hover .dd-launcher-count{color:var(--dsw-alias-label-primary)}
      .dd-panel{position:fixed;right:18px;top:64px;display:flex;align-items:center;z-index:9000;font-family:inherit;color:#e4e4e7;pointer-events:none}
      .dd-frame{position:relative;flex:none;display:flex;flex-direction:column;height:min(70vh,840px);max-height:calc(100vh - 72px);background:#18181b;border:1px solid #27272a;border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.14);overflow:visible;color:#f4f4f5;pointer-events:auto;transition:width .2s ease;animation:dd-in .18s ease-out}
      .dd-head{height:36px;flex:none;display:flex;align-items:center;gap:4px;padding:0 8px;background:#27272a;border-bottom:1px solid rgba(63,63,70,.6);border-radius:10px 10px 0 0;user-select:none;cursor:grab}
      .dd-head:active{cursor:grabbing}
      .dd-head-left{display:flex;align-items:center;justify-content:space-between;gap:5px;min-width:0;flex:1}
      .dd-device{display:flex;align-items:center;gap:4px;min-width:0;height:22px;padding:0 4px;margin-left:-4px;border:0;border-radius:5px;background:transparent;color:#f4f4f5;cursor:pointer;font:inherit}
      .dd-device:hover{background:rgba(255,255,255,.07)}
      .dd-device svg:first-child{color:#10b981;flex:none}
      .dd-device svg:last-child{color:#71717a;flex:none;transition:transform .15s ease}
      .dd-device[data-open="true"] svg:last-child{transform:rotate(180deg)}
      .dd-device-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:500}
      .dd-status{display:inline-flex;align-items:center;gap:3px;height:18px;padding:0 5px;border-radius:4px;font-size:10px;font-weight:500;white-space:nowrap;border:1px solid transparent;flex:none}
      .dd-status[data-compact="true"]{padding:0 4px}
      .dd-status[data-status="live"]{background:rgba(16,185,129,.12);color:#34d399;border-color:rgba(16,185,129,.2)}
      .dd-status[data-status="connecting"]{background:rgba(234,179,8,.12);color:#facc15;border-color:rgba(234,179,8,.2)}
      .dd-status[data-status="error"],.dd-status[data-status="offline"]{background:rgba(239,68,68,.12);color:#f87171;border-color:rgba(239,68,68,.2)}
      .dd-dot{width:4px;height:4px;border-radius:50%;background:currentColor}
      .dd-head-right{display:flex;align-items:center;gap:2px;flex:none}
      .dd-head-refresh{display:flex;align-items:center;justify-content:center;width:20px;height:20px;padding:0;border:0;border-radius:4px;background:transparent;color:#a1a1aa;cursor:pointer;transition:background .15s ease,color .15s ease}
      .dd-head-refresh:hover{background:rgba(255,255,255,.1);color:#f4f4f5}
      .dd-body{position:relative;flex:1;min-height:0;display:flex}
      .dd-rail{position:absolute;right:calc(100% + 2px);top:50%;transform:translateY(-50%);width:32px;display:flex;flex-direction:column;background:#fff;border:1px solid #e3e3e8;border-right:0;border-radius:9px 0 0 9px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.06);pointer-events:auto;z-index:2}
      .dd-rail button{display:flex;align-items:center;justify-content:center;width:100%;height:38px;border:0;border-bottom:1px solid #f1f1f4;background:transparent;color:#63636b;cursor:pointer;transition:background .15s ease,color .15s ease}
      .dd-rail button:last-child{border-bottom:0}
      .dd-rail-sep{height:1px;flex:none;background:#f1f1f4}
      .dd-rail-tip{position:fixed;z-index:9600;transform:translateY(-50%);padding:3px 7px;border-radius:5px;background:rgba(24,24,27,.95);border:1px solid rgba(255,255,255,.14);color:#f4f4f5;font-size:10.5px;line-height:1.4;white-space:nowrap;pointer-events:none;box-shadow:0 4px 12px rgba(0,0,0,.2)}
      .dd-rail button:hover:not([data-disabled="true"]){background:#fafafc;color:#1c1c21}
      .dd-rail button[data-disabled="true"]{opacity:.35;cursor:default}
      .dd-rail button[data-active="true"]{background:#eeedfd;color:#4f46e5}
      .dd-viewport{position:relative;flex:1;min-width:0;background:#000;overflow:hidden;touch-action:none;cursor:crosshair;border-radius:0 0 10px 10px}
      .dd-canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block}
      .dd-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:rgba(0,0,0,.82);color:#e4e4e7;text-align:center;padding:18px;font-size:12px;line-height:1.6;z-index:3}
      .dd-overlay strong{font-size:12.5px;font-weight:600;color:#fafafa}
      .dd-overlay p{margin:0;color:#a1a1aa;max-width:250px}
      .dd-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;height:28px;padding:0 12px;border:0;border-radius:6px;background:#3f3f46;color:#fafafa;font:inherit;font-size:11.5px;font-weight:500;cursor:pointer;transition:background .15s ease}
      .dd-btn:hover{background:#52525b}
      .dd-spinner{width:18px;height:18px;border:2px solid rgba(255,255,255,.2);border-top-color:#a5b4fc;border-radius:50%;animation:dd-spin .9s linear infinite}
      @keyframes dd-spin{to{transform:rotate(360deg)}}
      .dd-ripple{position:absolute;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;border:1px solid rgba(255,255,255,.9);background:rgba(255,255,255,.35);pointer-events:none;animation:dd-ripple .28s ease-out forwards}
      @keyframes dd-ripple{from{transform:scale(.5);opacity:1}to{transform:scale(1.6);opacity:0}}
      @keyframes dd-in{from{opacity:0}to{opacity:1}}
      .dd-strip{height:50px;flex:none;display:flex;align-items:center;gap:5px;padding:0 8px;background:#1c1c21;border-top:1px solid rgba(63,63,70,.6);border-radius:0 0 10px 10px;overflow-x:auto;overflow-y:hidden}
      .dd-strip-label{flex:none;font-size:10px;color:#71717a;padding-right:2px}
      .dd-thumb{flex:none;height:38px;padding:0;border:1px solid rgba(255,255,255,.14);border-radius:4px;background:#000;overflow:hidden;cursor:pointer;opacity:.75;transition:opacity .15s ease,border-color .15s ease}
      .dd-thumb:hover{opacity:1}
      .dd-thumb[data-selected="true"]{border-color:#818cf8;box-shadow:0 0 0 1px rgba(129,140,248,.7);opacity:1}
      .dd-thumb img{height:100%;width:auto;display:block;object-fit:cover}
      .dd-pop{position:absolute;right:42px;top:50%;transform:translateY(-50%);width:240px;max-width:calc(100% - 52px);display:flex;flex-direction:column;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;box-shadow:0 16px 40px rgba(0,0,0,.26);z-index:6;overflow:hidden;color:var(--dsw-alias-label-primary);pointer-events:auto}
      .dd-pop-head{display:flex;align-items:center;justify-content:space-between;gap:8px;height:34px;padding:0 8px 0 10px;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:11.5px;font-weight:500;flex:none}
      .dd-pop-head button{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border:0;border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
      .dd-pop-head button:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
      .dd-pop textarea{box-sizing:border-box;width:100%;height:92px;resize:none;border:0;outline:none;background:transparent;color:var(--dsw-alias-label-primary);padding:9px 10px;font:inherit;font-size:11.5px;line-height:1.6}
      .dd-pop textarea.dd-pop-url{height:72px;overflow-y:auto;word-break:break-all;overflow-wrap:anywhere}
      .dd-pop input{box-sizing:border-box;width:100%;height:36px;border:0;outline:none;background:transparent;color:var(--dsw-alias-label-primary);padding:0 10px;font:inherit;font-size:11.5px}
      .dd-pop-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 9px;border-top:1px solid var(--dsw-alias-border-l1)}
      .dd-pop-hint{font-size:10px;color:var(--dsw-alias-label-secondary);line-height:1.45;min-width:0}
      .dd-send{border:0;border-radius:6px;height:24px;padding:0 10px;background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-base);font:inherit;font-size:11px;font-weight:500;cursor:pointer;flex:none}
      .dd-send:disabled{opacity:.35;cursor:default}
      .dd-menu{position:absolute;left:8px;top:40px;width:238px;max-height:300px;overflow-y:auto;padding:4px;background:#232327;border:1px solid rgba(255,255,255,.12);border-radius:8px;box-shadow:0 18px 40px rgba(0,0,0,.45);z-index:8}
      .dd-menu-title{padding:5px 7px 4px;font-size:9.5px;letter-spacing:.04em;text-transform:uppercase;color:#71717a}
      .dd-menu-item{display:flex;align-items:center;gap:7px;width:100%;height:30px;padding:0 7px;border:0;border-radius:6px;background:transparent;color:#e4e4e7;cursor:pointer;font:inherit;text-align:left}
      .dd-menu-item:hover{background:rgba(255,255,255,.07)}
      .dd-menu-item[data-active="true"]{background:rgba(99,102,241,.18)}
      .dd-menu-item span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11.5px}
      .dd-menu-item em{flex:none;margin-left:auto;font-style:normal;font-size:9.5px;color:#71717a}
      .dd-notice{position:absolute;left:50%;bottom:68px;transform:translateX(-50%);max-width:300px;padding:6px 11px;border-radius:7px;background:rgba(24,24,27,.94);border:1px solid rgba(255,255,255,.14);color:#e4e4e7;font-size:11px;line-height:1.45;text-align:center;z-index:9;box-shadow:0 8px 20px rgba(0,0,0,.3);pointer-events:auto}
      .dd-picker{position:fixed;z-index:9500;width:min(300px,calc(100vw - 16px));display:flex;flex-direction:column;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;box-shadow:0 12px 32px rgba(0,0,0,.14);overflow:hidden;color:var(--dsw-alias-label-primary);font-family:inherit;pointer-events:auto}
      .dd-picker-scroll{flex:1;min-height:0;overflow-y:auto}
      .dd-picker-section{height:26px;padding:0 12px;display:flex;align-items:center;justify-content:space-between;background:var(--dsw-alias-bg-layer-2);border-top:1px solid var(--dsw-alias-border-l1);border-bottom:1px solid var(--dsw-alias-border-l1);font-size:10.5px;color:var(--dsw-alias-label-secondary)}
      .dd-picker-section:first-child{border-top:0}
      .dd-picker-row{display:flex;align-items:center;gap:7px;padding:6px 12px;border-bottom:1px solid var(--dsw-alias-border-l1)}
      .dd-picker-row:last-child{border-bottom:0}
      .dd-picker-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;border:0;background:transparent;color:inherit;font:inherit;text-align:left;padding:0;cursor:pointer}
      .dd-picker-line{display:flex;align-items:center;gap:6px;min-width:0}
      .dd-picker-name{font-size:12px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .dd-picker-main:hover .dd-picker-name{color:var(--dsw-alias-brand-primary)}
      .dd-picker-detail{font-size:10.5px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .dd-picker-status{flex:none;display:inline-flex;align-items:center;gap:3px;height:16px;padding:0 5px;border-radius:4px;font-size:9.5px;font-weight:500}
      .dd-picker-status[data-state="booted"]{background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 14%, transparent);color:var(--dsw-alias-state-success-primary)}
      .dd-picker-status[data-state="starting"]{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent);color:var(--dsw-alias-brand-primary)}
      .dd-picker-icon{flex:none;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:4px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
      .dd-picker-icon:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
      .dd-picker-icon[data-danger="true"]:hover:not(:disabled){background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent);color:var(--dsw-alias-state-error-primary)}
      .dd-picker-icon:disabled{opacity:.4;cursor:default}
      .dd-picker-start{flex:none;display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 8px;border:0;border-radius:5px;background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-base);font:inherit;font-size:10.5px;font-weight:500;cursor:pointer}
      .dd-picker-start:hover:not(:disabled){opacity:.9}
      .dd-picker-start:disabled{opacity:.4;cursor:default}
      .dd-picker-more{width:100%;height:24px;padding:0 12px;display:flex;align-items:center;gap:4px;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:10.5px;cursor:pointer}
      .dd-picker-more:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-brand-primary)}
      .dd-picker-empty{padding:16px 12px;text-align:center;font-size:11px;line-height:1.6;color:var(--dsw-alias-label-secondary)}
      .dd-picker-notice{padding:0 12px 7px;font-size:10.5px;line-height:1.45;color:var(--dsw-alias-label-secondary)}
      .dd-picker-wifi{border-top:1px solid var(--dsw-alias-border-l1);padding:8px 12px;display:flex;flex-direction:column;gap:5px;background:var(--dsw-alias-bg-base)}
      .dd-picker-wifi-row{display:flex;align-items:center;gap:6px}
      .dd-picker-input{flex:1;min-width:0;height:24px;padding:0 7px;border:1px solid var(--dsw-alias-border-l1);border-radius:5px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:11px;outline:none}
      .dd-picker-input:focus{border-color:var(--dsw-alias-brand-primary)}
      .dd-picker-result{display:flex;align-items:center;gap:4px;font-size:10.5px;color:var(--dsw-alias-label-secondary);overflow:hidden}
      .dd-picker-result[data-ok="false"]{color:var(--dsw-alias-state-error-primary)}
      .dd-picker-result[data-ok="true"]{color:var(--dsw-alias-state-success-primary)}
      .dd-picker-spinner{width:10px;height:10px;border:1.5px solid color-mix(in srgb, currentColor 25%, transparent);border-top-color:currentColor;border-radius:50%;animation:dd-spin .8s linear infinite;display:inline-block;flex:none}
      .dd-shot-mask{position:fixed;inset:0;z-index:9450;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.5);backdrop-filter:blur(2px)}
      .dd-shot-panel{width:min(560px,calc(100vw - 32px));max-height:min(72vh,640px);display:flex;flex-direction:column;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.35);overflow:hidden;color:var(--dsw-alias-label-primary);font-family:inherit;animation:dd-in .16s ease-out}
      .dd-shot-head{flex:none;display:flex;align-items:flex-start;gap:10px;padding:12px 12px 10px 14px;border-bottom:1px solid var(--dsw-alias-border-l1)}
      .dd-shot-titles{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
      .dd-shot-titles strong{font-size:12.5px;font-weight:600}
      .dd-shot-titles span{font-size:10.5px;line-height:1.45;color:var(--dsw-alias-label-secondary)}
      .dd-shot-close{flex:none;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
      .dd-shot-close:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
      .dd-shot-grid{flex:1;min-height:0;overflow-y:auto;padding:10px;display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px;align-content:start}
      .dd-shot-item{position:relative;display:flex;flex-direction:column;gap:0;padding:0;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:#000;overflow:hidden;cursor:pointer;color:var(--dsw-alias-label-primary);font:inherit;text-align:center;transition:border-color .15s ease,transform .15s ease}
      .dd-shot-item:hover:not(:disabled){border-color:var(--dsw-alias-brand-primary)}
      .dd-shot-item:disabled{cursor:default}
      .dd-shot-item[data-busy="true"]{border-color:var(--dsw-alias-brand-primary)}
      .dd-shot-item img{display:block;width:100%;aspect-ratio:9/16;object-fit:contain;background:#000;opacity:.92}
      .dd-shot-item:hover:not(:disabled) img{opacity:1}
      .dd-shot-time{display:block;padding:4px 2px;font-size:9.5px;line-height:1.3;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:var(--dsw-alias-bg-base)}
      .dd-shot-item[data-busy="true"] .dd-shot-time{color:var(--dsw-alias-brand-primary)}
      .dd-shot-state{flex:1;min-height:160px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:24px 18px;text-align:center;font-size:11px;line-height:1.6;color:var(--dsw-alias-label-secondary)}
      .dd-shot-state .dd-spinner{border-color:color-mix(in srgb, var(--dsw-alias-label-secondary) 25%, transparent);border-top-color:var(--dsw-alias-brand-primary)}
      .dd-shot-error{flex:none;padding:8px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:10.5px;line-height:1.45;color:var(--dsw-alias-state-error-primary)}
    `;

    function formatDuration(seconds, t) {
      const total = Math.max(0, Math.floor(Number(seconds) || 0));
      if (total < 60) return t.menuJustStarted;
      const minutes = Math.floor(total / 60);
      if (minutes < 60) return `${minutes} ${t.menuMinutes} ${total % 60} ${t.menuSeconds}`;
      return `${Math.floor(minutes / 60)} ${t.menuHours} ${minutes % 60} ${t.menuMinutes}`;
    }

    function DevicePicker({
      inventory,
      rect,
      menuRef,
      t,
      onOpenAndroid,
      onOpenIos,
      onOpenIosDevice,
      onStartAvd,
      onStartIos,
      onStop,
      onRefresh,
      onNotice,
      launching,
      stopping,
      wifiAddress,
      setWifiAddress,
      onConnectWifi,
      wifiBusy,
      wifiResult,
      notice,
    }) {
      const [expanded, setExpanded] = useState({});
      const android = inventory?.android || { running: [], avds: { available: false, items: [], pending: [], message: '' } };
      const ios = inventory?.ios || { available: false, running: [], pending: [], devices: { available: false, items: [] } };
      const iosDevices = ios.devices?.items || [];
      const running = [
        ...(android.running || []).map((row) => ({ ...row, platform: 'android' })),
        ...(ios.running || []).map((simulator) => ({
          platform: 'ios',
          udid: simulator.udid,
          name: simulator.name,
          serial: simulator.udid,
          state: 'booted',
          kind: 'ios',
          uptimeSeconds: null,
          version: simulator.version,
        })),
      ];
      const pendingAvds = android.avds?.pending || [];
      const pendingIos = ios.pending || [];
      const hasContent = running.length > 0 || pendingAvds.length > 0 || pendingIos.length > 0 || iosDevices.length > 0;
      const limit = (key, total) => (expanded[key] ? total : Math.min(2, total));
      const toggle = (key) => setExpanded((current) => ({ ...current, [key]: !current[key] }));
      const more = (key, total, unit) =>
        total > 2
          ? h('button', {
              key: `more-${key}`,
              type: 'button',
              className: 'dd-picker-more',
              onClick: () => toggle(key),
            },
              h('span', null, expanded[key] ? t.menuCollapse : `${t.menuAll} ${total} ${unit}`),
              h(Icon, { name: 'chevron', size: 9 }),
            )
          : null;

      const keyOf = (row) => (row.platform === 'ios' ? `ios-${row.udid}` : `android-${row.serial || row.pid}`);
      const kindOf = (row) => (row.platform === 'ios' ? t.menuIosEmulator : row.kind === '真机' ? t.menuReal : t.menuEmulator);
      const detailOf = (row) => {
        if (row.platform === 'ios') {
          return `${t.menuIosEmulator}${row.version ? ` · iOS ${row.version}` : ''}`;
        }
        if (row.state === 'starting') return `${t.menuEmulator} · ${t.menuStarting}`;
        if (row.kind === '真机') return `${t.menuReal} · ${row.serial}`;
        const uptime = row.uptimeSeconds !== null && row.uptimeSeconds !== undefined
          ? formatDuration(row.uptimeSeconds, t)
          : row.serial;
        return `${t.menuEmulator} · ${uptime}`;
      };
      const openRow = (row) => {
        if (row.platform === 'ios') {
          onOpenIosDevice({ ...row, kind: 'simulator' });
          return;
        }
        if (!row.serial) {
          onNotice(t.menuStartingWait);
          return;
        }
        onOpenAndroid(row);
      };

      return h('div', {
        ref: menuRef,
        className: 'dd-picker',
        style: {
          top: rect.top,
          right: rect.right,
          maxHeight: `calc(100vh - ${Math.max(120, rect.top + 12)}px)`,
        },
      },
        h('div', { className: 'dd-picker-scroll' },
          h('div', { className: 'dd-picker-section' },
            h('span', null, t.menuRunning),
            h('span', null, String(running.length)),
          ),
          running.length === 0
            ? h('div', { className: 'dd-picker-empty', style: { padding: '10px 12px', textAlign: 'left' } }, t.menuNoOnline)
            : h('div', null,
                running.slice(0, limit('running', running.length)).map((row) => h('div', {
                  key: keyOf(row),
                  className: 'dd-picker-row',
                },
                  h('button', {
                    type: 'button',
                    className: 'dd-picker-main',
                    title: t.menuOpenMirror,
                    onClick: () => openRow(row),
                  },
                    h('div', { className: 'dd-picker-line' },
                      h('span', {
                        style: {
                          display: 'inline-flex',
                          flex: 'none',
                          color: row.platform === 'android' ? '#10b981' : 'var(--dsw-alias-label-secondary)',
                        },
                      }, h(Icon, { name: 'phone', size: 11 })),
                      h('span', { className: 'dd-picker-name' }, row.name),
                      h('span', {
                        className: 'dd-picker-status',
                        'data-state': row.state === 'booted' ? 'booted' : 'starting',
                      }, row.state === 'booted' ? t.menuReady : t.menuStarting),
                    ),
                    h('div', { className: 'dd-picker-detail' }, detailOf(row)),
                  ),
                  row.platform === 'android' && row.serial && h('button', {
                    type: 'button',
                    className: 'dd-picker-icon',
                    title: t.menuOpenMirror,
                    onClick: () => onOpenAndroid(row),
                  }, h(Icon, { name: 'monitorplay', size: 12 })),
                  row.platform === 'ios' && h('button', {
                    type: 'button',
                    className: 'dd-picker-icon',
                    title: t.menuOpenSimulator,
                    onClick: () => void onOpenIos(row),
                  }, h(Icon, { name: 'external', size: 12 })),
                  (row.platform === 'ios' || row.kind !== '真机') && h('button', {
                    type: 'button',
                    className: 'dd-picker-icon',
                    'data-danger': 'true',
                    title: t.menuStop,
                    disabled: Boolean(stopping),
                    onClick: () => void onStop(row),
                  }, stopping === keyOf(row)
                    ? h('span', { className: 'dd-picker-spinner' })
                    : h(Icon, { name: 'power', size: 12 })),
                )),
                more('running', running.length, t.menuDeviceUnit),
              ),

          iosDevices.length > 0 && h(Fragment, { key: 'ios-device-section' },
            h('div', { className: 'dd-picker-section' },
              h('span', null, t.menuIosDevices),
              h('span', null, String(iosDevices.length)),
            ),
            h('div', null,
              iosDevices.map((device) => h('div', {
                key: device.udid,
                className: 'dd-picker-row',
              },
                h('button', {
                  type: 'button',
                  className: 'dd-picker-main',
                  title: t.menuIosMirrorOpen,
                  onClick: () => onOpenIosDevice(device),
                },
                  h('div', { className: 'dd-picker-line' },
                    h('span', {
                      style: { display: 'inline-flex', flex: 'none', color: '#0ea5e9' },
                    }, h(Icon, { name: 'phone', size: 11 })),
                    h('span', { className: 'dd-picker-name' }, device.name),
                    device.mirroring?.status === 'ready' && h('span', {
                      className: 'dd-picker-status',
                      'data-state': 'booted',
                    }, t.iosReady),
                    device.mirroring?.status === 'starting' && h('span', {
                      className: 'dd-picker-status',
                      'data-state': 'starting',
                    }, t.menuStarting),
                  ),
                  h('div', { className: 'dd-picker-detail' },
                    `${device.model || device.productType || 'iOS'}${device.osVersion ? ` · iOS ${device.osVersion}` : ''}${device.transport ? ` · ${device.transport}` : ''}`,
                  ),
                ),
                h('button', {
                  type: 'button',
                  className: 'dd-picker-icon',
                  title: t.menuIosMirrorOpen,
                  onClick: () => onOpenIosDevice(device),
                }, h(Icon, { name: 'monitorplay', size: 12 })),
              )),
            ),
          ),

          android.avds?.available && pendingAvds.length > 0 && h(Fragment, { key: 'android-section' },
            h('div', { className: 'dd-picker-section' },
              h('span', null, t.menuAndroidEmulators),
            ),
            h('div', null,
              pendingAvds.slice(0, limit('android', pendingAvds.length)).map((name) => h('div', {
                key: name,
                className: 'dd-picker-row',
              },
                h('div', { className: 'dd-picker-main', style: { cursor: 'default' } },
                  h('div', { className: 'dd-picker-name' }, name),
                  h('div', { className: 'dd-picker-detail' }, t.menuNotStarted),
                ),
                h('button', {
                  type: 'button',
                  className: 'dd-picker-start',
                  disabled: Boolean(launching),
                  onClick: () => void onStartAvd(name),
                },
                  launching === `avd-${name}`
                    ? h('span', { className: 'dd-picker-spinner' })
                    : h(Icon, { name: 'play', size: 9 }),
                  h('span', null, launching === `avd-${name}` ? t.menuStartingBtn : t.menuStart),
                ),
              )),
              more('android', pendingAvds.length, t.menuItemUnit),
            ),
          ),

          ios.available && pendingIos.length > 0 && h(Fragment, { key: 'ios-section' },
            h('div', { className: 'dd-picker-section' },
              h('span', null, t.menuIosEmulators),
            ),
            h('div', null,
              pendingIos.slice(0, limit('ios', pendingIos.length)).map((simulator) => h('div', {
                key: simulator.udid,
                className: 'dd-picker-row',
              },
                h('div', { className: 'dd-picker-main', style: { cursor: 'default' } },
                  h('div', { className: 'dd-picker-name' }, simulator.name),
                  h('div', { className: 'dd-picker-detail' },
                    `${t.menuShutdown}${simulator.version ? ` · iOS ${simulator.version}` : ''}`,
                  ),
                ),
                h('button', {
                  type: 'button',
                  className: 'dd-picker-start',
                  disabled: Boolean(launching),
                  onClick: () => void onStartIos(simulator),
                },
                  launching === `ios-${simulator.udid}`
                    ? h('span', { className: 'dd-picker-spinner' })
                    : h(Icon, { name: 'play', size: 9 }),
                  h('span', null, launching === `ios-${simulator.udid}` ? t.menuStartingBtn : t.menuStart),
                ),
              )),
              more('ios', pendingIos.length, t.menuDeviceUnit),
            ),
          ),

          !hasContent && h('div', { className: 'dd-picker-empty' },
            t.menuEmpty,
            h('br', null),
            t.menuEmptyHint,
          ),

          inventory?.adb?.available === false && h('div', { className: 'dd-picker-notice' },
            inventory.adb.error || t.adbMissing,
          ),
        ),

        notice && h('div', { className: 'dd-picker-notice' }, notice),

        h('div', { className: 'dd-picker-wifi' },
          h('div', { className: 'dd-picker-wifi-row' },
            h(Icon, { name: 'wifi', size: 12 }),
            h('input', {
              className: 'dd-picker-input',
              value: wifiAddress,
              placeholder: t.menuWifiPlaceholder,
              spellCheck: false,
              onChange: (event) => setWifiAddress(event.target.value),
              onKeyDown: (event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void onConnectWifi();
                }
              },
            }),
            h('button', {
              type: 'button',
              className: 'dd-picker-start',
              disabled: !wifiAddress.trim() || wifiBusy,
              onClick: () => void onConnectWifi(),
            }, wifiBusy ? t.menuConnecting : t.menuConnect),
            h('button', {
              type: 'button',
              className: 'dd-picker-icon',
              title: t.menuRefresh,
              onClick: () => void onRefresh(),
            }, h(Icon, { name: 'refresh', size: 12 })),
          ),
          wifiResult && h('div', {
            className: 'dd-picker-result',
            'data-ok': wifiResult.ok ? 'true' : 'false',
          }, wifiResult.text),
        ),
      );
    }

    function makeMirrorHost(ctx) {
      return function DeviceMirrorHost() {
        const open = useSharedOpen();
        const platform = useSharedPlatform();

        useEffect(() => {
          const onKeyDown = (event) => {
            if (!event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
            if (event.repeat) return;
            if (String(event.key).toLowerCase() !== 'm') return;
            event.preventDefault();
            event.stopPropagation();
            setSharedOpen(!shared.open);
          };
          window.addEventListener('keydown', onKeyDown, true);
          return () => window.removeEventListener('keydown', onKeyDown, true);
        }, []);

        return h(Fragment, null,
          h('style', { 'data-dsh-device-deck': '' }, CSS),
          open
            ? ReactDOM.createPortal(
                platform === 'ios'
                  ? h(IosPanel, {
                      ctx,
                      onClose: () => setSharedOpen(false),
                    })
                  : h(Panel, {
                      ctx,
                      onClose: () => setSharedOpen(false),
                    }),
                document.body,
              )
            : null,
        );
      };
    }

    function makeLauncher(ctx) {
      return function DeviceMirrorLauncher(props) {
        const open = useSharedOpen();
        const [menuOpen, setMenuOpen] = useState(false);
        const [menuRect, setMenuRect] = useState(null);
        const [inventory, setInventory] = useState(null);
        const [deviceCount, setDeviceCount] = useState(0);
        const [menuNotice, setMenuNotice] = useState('');
        const [launching, setLaunching] = useState(null);
        const [stopping, setStopping] = useState(null);
        const [wifiAddress, setWifiAddress] = useState('');
        const [wifiBusy, setWifiBusy] = useState(false);
        const [wifiResult, setWifiResult] = useState(null);
        const t = useCopy(ctx);
        const shotPickerOpen = useShotPickerOpen(props.sessionId);
        const buttonRef = useRef(null);
        const menuRef = useRef(null);

        const reloadInventory = useCallback(async () => {
          try {
            const data = await apiJson('/inventory');
            setInventory(data);
            const count =
              (Array.isArray(data.android?.running) ? data.android.running.length : 0) +
              (Array.isArray(data.ios?.running) ? data.ios.running.length : 0) +
              (Array.isArray(data.ios?.devices?.items) ? data.ios.devices.items.length : 0);
            setDeviceCount(count);
          } catch (error) {
            setInventory((previous) => previous || {
              adb: { available: false, error: error.message },
              android: { running: [], avds: { available: false, items: [], pending: [], message: error.message } },
              ios: { available: false, message: error.message, running: [], pending: [] },
            });
          }
        }, []);

        useEffect(() => {
          void reloadInventory();
          const timer = window.setInterval(() => void reloadInventory(), menuOpen ? 5000 : 15000);
          return () => window.clearInterval(timer);
        }, [reloadInventory, menuOpen]);

        useEffect(() => {
          if (!menuOpen) return undefined;
          const onPointerDown = (event) => {
            if (menuRef.current?.contains(event.target) || buttonRef.current?.contains(event.target)) return;
            setMenuOpen(false);
          };
          const onKeyDown = (event) => {
            if (event.key === 'Escape') setMenuOpen(false);
          };
          document.addEventListener('pointerdown', onPointerDown, true);
          window.addEventListener('keydown', onKeyDown);
          return () => {
            document.removeEventListener('pointerdown', onPointerDown, true);
            window.removeEventListener('keydown', onKeyDown);
          };
        }, [menuOpen]);

        useEffect(() => {
          if (!menuOpen) return undefined;
          const close = () => setMenuOpen(false);
          window.addEventListener('resize', close);
          return () => window.removeEventListener('resize', close);
        }, [menuOpen]);

        const openMenu = () => {
          if (menuOpen) {
            setMenuOpen(false);
            return;
          }
          const rect = buttonRef.current?.getBoundingClientRect();
          if (rect) {
            setMenuRect({
              top: Math.round(rect.bottom + 6),
              right: Math.max(8, Math.round(window.innerWidth - rect.right)),
            });
          }
          setMenuOpen(true);
          setMenuNotice('');
          setWifiResult(null);
          if (open) setSharedOpen(false);
          void reloadInventory();
        };

        const openAndroid = (row) => {
          if (!row.serial) {
            setMenuNotice(t.menuStartingWait);
            return;
          }
          shared.platform = 'android';
          shared.serial = row.serial;
          saveStore();
          notifyStore();
          setSharedOpen(true);
          setMenuOpen(false);
        };

        const openIosMirror = (row) => {
          shared.platform = 'ios';
          shared.iosKind = row.kind === 'simulator' ? 'simulator' : 'device';
          shared.serial = row.udid;
          saveStore();
          notifyStore();
          setSharedOpen(true);
          setMenuOpen(false);
        };

        const openIos = async (row) => {
          try {
            const result = await postJson('/ios/open', { udid: row.udid });
            setMenuNotice(result.message || t.menuIosUnsupported);
          } catch (error) {
            setMenuNotice(error.message);
          }
        };

        const startAvd = async (name) => {
          if (launching) return;
          const key = `avd-${name}`;
          setLaunching(key);
          setMenuNotice('');
          try {
            const result = await postJson('/emulator/start', { name });
            setMenuNotice(result.message || t.menuStartingBtn);
          } catch (error) {
            setMenuNotice(error.message);
          } finally {
            window.setTimeout(() => setLaunching((current) => (current === key ? null : current)), 2500);
            void reloadInventory();
          }
        };

        const startIos = async (simulator) => {
          if (launching) return;
          const key = `ios-${simulator.udid}`;
          setLaunching(key);
          setMenuNotice('');
          try {
            const result = await postJson('/ios/boot', { udid: simulator.udid });
            setMenuNotice(result.message || t.menuStartingBtn);
          } catch (error) {
            setMenuNotice(error.message);
          } finally {
            window.setTimeout(() => setLaunching((current) => (current === key ? null : current)), 2500);
            void reloadInventory();
          }
        };

        const stopRow = async (row) => {
          if (stopping) return;
          const key = row.platform === 'ios' ? `ios-${row.udid}` : `android-${row.serial || row.pid}`;
          setStopping(key);
          try {
            const result = row.platform === 'ios'
              ? await postJson('/ios/shutdown', { udid: row.udid })
              : await postJson('/emulator/stop', { serial: row.serial, pid: row.pid });
            setMenuNotice(result.message || t.menuStopRequested);
          } catch (error) {
            setMenuNotice(error.message);
          } finally {
            setStopping(null);
            window.setTimeout(() => void reloadInventory(), 600);
          }
        };

        const connectWifi = async () => {
          const address = wifiAddress.trim();
          if (!address || wifiBusy) return;
          setWifiBusy(true);
          setWifiResult(null);
          try {
            const result = await postJson('/wifi/connect', { address });
            setWifiResult({ ok: Boolean(result.success), text: result.message });
            if (result.success) setWifiAddress('');
          } catch (error) {
            setWifiResult({ ok: false, text: error.message });
          } finally {
            setWifiBusy(false);
            void reloadInventory();
          }
        };

        const title = deviceCount > 0
          ? `设备 · ${deviceCount} ${t.menuOnline}`
          : `设备 · ${t.menuNoDevice}`;

        return h(Fragment, null,
          h('button', {
            ref: buttonRef,
            type: 'button',
            className: 'dd-launcher',
            title,
            'aria-label': t.title,
            'aria-keyshortcuts': 'Control+M',
            'aria-expanded': menuOpen,
            'data-active': menuOpen || open ? 'true' : 'false',
            'data-count': deviceCount > 0 ? 'true' : 'false',
            onClick: openMenu,
          },
            h(LauncherIcon, { size: 16 }),
            deviceCount > 0 && h('span', { className: 'dd-launcher-count' }, deviceCount > 99 ? '99+' : String(deviceCount)),
          ),
          shotPickerOpen && h(ShotPicker, {
            ctx,
            sessionId: props.sessionId,
            inputActions: props.inputActions,
            onClose: () => closeShotPicker(props.sessionId),
          }),
          menuOpen && menuRect
            ? ReactDOM.createPortal(
                h(DevicePicker, {
                  inventory,
                  rect: menuRect,
                  menuRef,
                  t,
                  onOpenAndroid: openAndroid,
                  onOpenIos: openIos,
                  onOpenIosDevice: openIosMirror,
                  onStartAvd: startAvd,
                  onStartIos: startIos,
                  onStop: stopRow,
                  onRefresh: reloadInventory,
                  onNotice: setMenuNotice,
                  launching,
                  stopping,
                  wifiAddress,
                  setWifiAddress,
                  onConnectWifi: connectWifi,
                  wifiBusy,
                  wifiResult,
                  notice: menuNotice,
                }),
                document.body,
              )
            : null,
        );
      };
    }

    function Panel({ ctx, onClose }) {
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
        if (!shot || shot.selected) return;
        try {
          await postJson('/screenshots/select', { path: shot.path });
          setShots((previous) => previous.map((item) => ({ ...item, selected: item.path === shot.path })));
        } catch (selectError) {
          flash(selectError.message);
        }
      }, [flash]);

      const sendText = async () => {
        const value = text.trim();
        if (!value || busy) return;
        setInputOpen(false);
        const sent = await runAction({ type: 'text', text: value });
        if (sent) setText((current) => (current === value ? '' : current));
      };

      const openUrl = () => {
        const value = url.trim();
        if (!value || busy) return;
        void runAction({ type: 'openUrl', url: value });
        setUrl('');
        setLinkOpen(false);
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
            railButton(t.railBack, 'back', () => void runAction({ type: 'key', key: 'back' }), { disabled: !serial || busy }),
            railButton(t.railHome, 'home', () => void runAction({ type: 'key', key: 'home' }), { disabled: !serial || busy }),
            railButton(t.railRecents, 'recents', () => void runAction({ type: 'key', key: 'recents' }), { disabled: !serial || busy }),
            railButton(t.railText, 'keyboard', () => {
              setInputOpen((value) => !value);
              setLinkOpen(false);
            }, { disabled: !serial, active: inputOpen }),
            railButton(t.railLink, 'link', () => {
              setLinkOpen((value) => !value);
              setInputOpen(false);
            }, { disabled: !serial, active: linkOpen }),
            railButton(t.railFile, 'paperclip', () => fileInputRef.current?.click(), { disabled: !serial || pushing }),
            h('div', { className: 'dd-rail-sep' }),
            shots.length > 0 && railButton(t.railHistory, 'history', () => setStripOpen((value) => !value), { active: stripOpen }),
            railButton(t.railCapture, 'camera', () => void capture(), { disabled: !serial || busy }),
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
                'data-selected': shot.selected ? 'true' : 'false',
                title: shot.selected ? t.selected : shot.name,
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

        linkOpen && h('div', { className: 'dd-pop', style: { top: '56%' } },
          h('div', { className: 'dd-pop-head' },
            h('span', null, t.link),
            h('button', { type: 'button', onClick: () => setLinkOpen(false), title: t.close }, h(Icon, { name: 'close', size: 12 })),
          ),
          h('textarea', {
            className: 'dd-pop-url',
            value: url,
            autoFocus: true,
            spellCheck: false,
            placeholder: t.urlHint,
            onChange: (event) => setUrl(event.target.value),
            onKeyDown: (event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                openUrl();
              }
            },
          }),
          h('div', { className: 'dd-pop-foot' },
            h('span', { className: 'dd-pop-hint' }, t.enterUrl),
            h('button', { type: 'button', className: 'dd-send', disabled: !url.trim() || busy, onClick: openUrl }, t.open),
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

    function IosPanel({ ctx, onClose }) {
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
      const [stripOpen, setStripOpen] = useState(false);
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

      const device = devices.find((item) => item.udid === udid);
      const deviceName = device?.name || udid || 'iPhone';

      useEffect(() => {
        if (!udid) return;
        shared.serial = udid;
        shared.platform = 'ios';
        shared.iosKind = kind;
        saveStore();
      }, [udid, kind]);

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
      }, [refreshShots]);

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

      const openUrl = () => {
        const value = url.trim();
        if (!value) return;
        void sendAction({ type: 'openUrl', url: value });
        setUrl('');
        setLinkOpen(false);
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
              railButton(t.railLink, 'link', () => {
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
                  'data-selected': shot.selected ? 'true' : 'false',
                  title: shot.selected ? t.selected : shot.name,
                  onClick: () => {
                    void apiJson('/screenshots/select', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ path: shot.path }),
                    }).catch(() => undefined);
                  },
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
            h('button', { type: 'button', className: 'dd-send', disabled: !text.trim(), onClick: () => void sendText() }, t.sendText),
          ),
        ),

        linkOpen && h('div', { className: 'dd-pop', style: { top: '56%' } },
          h('div', { className: 'dd-pop-head' },
            h('span', null, t.link),
            h('button', { type: 'button', onClick: () => setLinkOpen(false), title: t.close }, h(Icon, { name: 'close', size: 12 })),
          ),
          h('textarea', {
            className: 'dd-pop-url',
            value: url,
            autoFocus: true,
            spellCheck: false,
            placeholder: t.urlHint,
            onChange: (event) => setUrl(event.target.value),
            onKeyDown: (event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                openUrl();
              }
            },
          }),
          h('div', { className: 'dd-pop-foot' },
            h('span', { className: 'dd-pop-hint' }, t.enterUrl),
            h('button', { type: 'button', className: 'dd-send', disabled: !url.trim(), onClick: openUrl }, t.open),
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

    function ShotMenuIcon({ size = 14 }) {
      return h(Icon, { name: 'camera', size });
    }

    return {
      inject: ['slots', 'sessions', 'locale', 'conversation'],
      apply(ctx) {
        const Launcher = makeLauncher(ctx);
        const MirrorHost = makeMirrorHost(ctx);
        ctx.slots.inject('shell.overlay', () =>
          ctx.slots.register({
            name: 'shell.overlay',
            id: 'device-deck-mirror',
            order: 20,
          }, MirrorHost),
        );
        ctx.slots.inject('conversation.session.header.utilities', () =>
          ctx.slots.register({
            name: 'conversation.session.header.utilities',
            id: 'device-deck',
            order: 10,
          }, Launcher),
        );
        ctx.inject(['commandUi'], (scope) => {
          const commands = scope.get('commandUi');
          scope.effect(() => commands.register({
            name: 'device-shot',
            label: () => currentCopy(ctx).menuShot,
            description: () => currentCopy(ctx).menuShotHint,
            icon: ShotMenuIcon,
            available: (session) => Boolean(session?.sessionId && ctx.sessions?.binding?.(session.sessionId)),
            ui: {
              kind: 'action',
              run: (session) => {
                openShotPicker(session.sessionId);
              },
            },
          }), 'device-deck: screenshot command');
        });
      },
    };
  },
});
