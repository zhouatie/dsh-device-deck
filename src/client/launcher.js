import { Fragment, createElement as h, useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { apiJson, postJson } from './api.js';
import { useCopy } from './i18n.js';
import { notifyStore, saveStore, setSharedOpen, shared, useSharedOpen } from './store.js';
import { formatDuration, Icon, LauncherIcon } from './ui.js';

export function DevicePicker({
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
          'data-expanded': expanded[key] ? 'true' : 'false',
          onClick: () => toggle(key),
        },
          h('span', null, expanded[key] ? t.menuCollapse : `${t.menuAll} ${total} ${unit}`),
          h(Icon, { name: 'chevron', size: 10 }),
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
        h('span', { className: 'dd-picker-count' }, String(running.length)),
      ),
      running.length === 0
        ? h('div', { className: 'dd-picker-empty dd-picker-empty-inline' }, t.menuNoOnline)
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
                    className: 'dd-picker-glyph',
                  }, h(Icon, { name: 'phone', size: 13 })),
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
              }, h(Icon, { name: 'monitorplay', size: 14 })),
              row.platform === 'ios' && h('button', {
                type: 'button',
                className: 'dd-picker-icon',
                title: t.menuOpenSimulator,
                onClick: () => void onOpenIos(row),
              }, h(Icon, { name: 'external', size: 14 })),
              (row.platform === 'ios' || row.kind !== '真机') && h('button', {
                type: 'button',
                className: 'dd-picker-icon',
                'data-danger': 'true',
                title: t.menuStop,
                disabled: Boolean(stopping),
                onClick: () => void onStop(row),
              }, stopping === keyOf(row)
                ? h('span', { className: 'dd-picker-spinner' })
                : h(Icon, { name: 'power', size: 13 })),
            )),
            more('running', running.length, t.menuDeviceUnit),
          ),

      iosDevices.length > 0 && h(Fragment, { key: 'ios-device-section' },
        h('div', { className: 'dd-picker-section' },
          h('span', null, t.menuIosDevices),
          h('span', { className: 'dd-picker-count' }, String(iosDevices.length)),
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
                  className: 'dd-picker-glyph',
                }, h(Icon, { name: 'phone', size: 13 })),
                h('span', { className: 'dd-picker-name' }, device.name),
                device.mirroring?.status === 'ready' && h('span', {
                  className: 'dd-picker-status',
                  'data-state': 'booted',
                }, t.iosReady),
                device.mirroring?.status === 'starting' && h('span', {
                  className: 'dd-picker-status',
                  'data-state': 'starting',
                }, t.menuStarting),
                device.connected === false && h('span', {
                  className: 'dd-picker-status',
                  'data-state': 'starting',
                }, t.menuUnconnected),
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
            }, h(Icon, { name: 'monitorplay', size: 14 })),
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
            'data-static': 'true',
          },
            h('div', { className: 'dd-picker-main' },
              h('div', { className: 'dd-picker-line' },
                h('span', {
                  className: 'dd-picker-glyph',
                }, h(Icon, { name: 'phone', size: 13 })),
                h('div', { className: 'dd-picker-name' }, name),
              ),
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
                : h(Icon, { name: 'play', size: 10 }),
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
            'data-static': 'true',
          },
            h('div', { className: 'dd-picker-main' },
              h('div', { className: 'dd-picker-line' },
                h('span', {
                  className: 'dd-picker-glyph',
                }, h(Icon, { name: 'phone', size: 13 })),
                h('div', { className: 'dd-picker-name' }, simulator.name),
              ),
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
                : h(Icon, { name: 'play', size: 10 }),
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

      inventory?.ios?.devices?.available === false && h('div', { className: 'dd-picker-notice' },
        inventory.ios.devices.message || t.iosDevicesFailed,
      ),
    ),

    notice && h('div', { className: 'dd-picker-notice' }, notice),

    h('div', { className: 'dd-picker-wifi' },
      h('div', { className: 'dd-picker-wifi-row' },
        h(Icon, { name: 'wifi', size: 14 }),
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
          className: 'dd-picker-connect',
          disabled: !wifiAddress.trim() || wifiBusy,
          onClick: () => void onConnectWifi(),
        }, wifiBusy ? t.menuConnecting : t.menuConnect),
        h('button', {
          type: 'button',
          className: 'dd-picker-icon',
          title: t.menuRefresh,
          onClick: () => void onRefresh(),
        }, h(Icon, { name: 'refresh', size: 14 })),
      ),
      wifiResult && h('div', {
        className: 'dd-picker-result',
        'data-ok': wifiResult.ok ? 'true' : 'false',
      }, wifiResult.text),
    ),
  );
}

export function makeLauncher(ctx) {
  return function DeviceMirrorLauncher() {
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
