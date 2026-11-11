import { createElement as h } from 'react';
import { useSharedLinks } from './store.js';

export function concatBytes(left, right) {
  if (left.length === 0) return right;
  const out = new Uint8Array(left.length + right.length);
  out.set(left, 0);
  out.set(right, left.length);
  return out;
}

export function avcCodecString(data) {
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

export function statusLabel(t, status) {
  if (status === 'live') return t.live;
  if (status === 'connecting') return t.connecting;
  return t.offline;
}

export function Icon({ name, size = 15 }) {
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
    case 'globe':
      return h('svg', common, h('circle', { cx: 12, cy: 12, r: 9 }), h('path', { d: 'M3 12h18' }), h('ellipse', { cx: 12, cy: 12, rx: 4.5, ry: 9 }));
    case 'pin':
      return h('svg', common,
        h('path', { d: 'M9 10.76a2 2 0 0 1-1.11-1.79L7 4h10l-.89 4.97A2 2 0 0 1 15 10.76V12l2 2H7l2-2z' }),
        h('path', { d: 'M12 14v7' }),
      );
    case 'copy':
      return h('svg', common, h('rect', { x: 9, y: 9, width: 11, height: 11, rx: 2 }), h('path', { d: 'M5 15V6a2 2 0 0 1 2-2h8' }));
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

export function LinkHistory({ t, onPick, onTogglePin, onRemove }) {
  const links = useSharedLinks();
  if (links.length === 0) return h('div', { className: 'dd-link-empty' }, t.linkEmpty);
  const ordered = [...links].sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || (b.at - a.at));
  return h('div', { className: 'dd-link-history' },
    h('div', { className: 'dd-link-history-title' }, t.linkHistory),
    ordered.map((link) => h('div', {
      className: 'dd-link-row',
      key: link.url,
      'data-pinned': link.pinned ? 'true' : 'false',
    },
      h('button', {
        type: 'button',
        className: 'dd-link-pick',
        title: link.url,
        onClick: () => onPick(link.url),
      }, h('span', { className: 'dd-link-url' }, link.url)),
      h('button', {
        type: 'button',
        className: 'dd-link-icon dd-link-pin',
        title: link.pinned ? t.linkUnpin : t.linkPin,
        'aria-label': link.pinned ? t.linkUnpin : t.linkPin,
        'data-pinned': link.pinned ? 'true' : 'false',
        onClick: () => onTogglePin(link.url),
      }, h(Icon, { name: 'pin', size: 11 })),
      h('button', {
        type: 'button',
        className: 'dd-link-icon dd-link-remove',
        title: t.linkRemove,
        'aria-label': t.linkRemove,
        onClick: () => onRemove(link.url),
      }, h(Icon, { name: 'close', size: 10 })),
    )),
  );
}

export function LauncherIcon({ size = 16 }) {
  return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, style: { display: 'block' } },
    h('rect', { x: 6.5, y: 2.5, width: 11, height: 19, rx: 2.5 }),
    h('path', { d: 'M10.5 5.5h3' }),
    h('circle', { cx: 12, cy: 18.2, r: 0.6, fill: 'currentColor', stroke: 'none' }),
  );
}

export function formatDuration(seconds, t) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  if (total < 60) return t.menuJustStarted;
  const minutes = Math.floor(total / 60);
  if (minutes < 60) return `${minutes} ${t.menuMinutes} ${total % 60} ${t.menuSeconds}`;
  return `${Math.floor(minutes / 60)} ${t.menuHours} ${minutes % 60} ${t.menuMinutes}`;
}
