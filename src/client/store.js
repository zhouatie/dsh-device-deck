import { useSyncExternalStore } from 'react';
import { LINK_LIMIT, STORE_KEY } from './constants.js';

function normalizeLinks(value) {
  if (!Array.isArray(value)) return [];
  const links = [];
  for (const item of value) {
    const url = typeof item?.url === 'string' ? item.url.trim() : '';
    if (!url || links.some((entry) => entry.url === url)) continue;
    links.push({
      url,
      pinned: Boolean(item.pinned),
      at: Number.isFinite(item.at) ? item.at : 0,
    });
  }
  return links;
}

function trimLinks(links) {
  const next = [];
  let recent = 0;
  for (const link of links) {
    if (link.pinned) {
      next.push(link);
      continue;
    }
    recent += 1;
    if (recent <= LINK_LIMIT) next.push(link);
  }
  return next;
}

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
      links: trimLinks(normalizeLinks(parsed?.links)),
    };
  } catch {
    return { open: false, platform: 'android', iosKind: 'device', serial: '', offset: { x: 0, y: 0 }, links: [] };
  }
}

export const shared = loadStore();
const openListeners = new Set();

export function saveStore() {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(shared));
  } catch {
    /* ignore */
  }
}

export function setSharedOpen(next) {
  if (shared.open === next) return;
  shared.open = next;
  saveStore();
  for (const listener of openListeners) listener();
}

export function notifyStore() {
  for (const listener of openListeners) listener();
}

export function subscribeStore(listener) {
  openListeners.add(listener);
  return () => openListeners.delete(listener);
}

export function useSharedOpen() {
  return useSyncExternalStore(subscribeStore, () => shared.open);
}

export function useSharedPlatform() {
  return useSyncExternalStore(subscribeStore, () => shared.platform);
}

export function useSharedLinks() {
  return useSyncExternalStore(subscribeStore, () => shared.links);
}

export function rememberLink(url) {
  const value = String(url || '').trim();
  if (!value) return;
  const previous = shared.links.find((item) => item.url === value);
  shared.links = trimLinks([
    { url: value, pinned: Boolean(previous?.pinned), at: Date.now() },
    ...shared.links.filter((item) => item.url !== value),
  ]);
  saveStore();
  notifyStore();
}

export function toggleLinkPin(url) {
  const target = shared.links.find((item) => item.url === url);
  if (!target) return;
  target.pinned = !target.pinned;
  shared.links = [...shared.links];
  saveStore();
  notifyStore();
}

export function removeLink(url) {
  const next = shared.links.filter((item) => item.url !== url);
  if (next.length === shared.links.length) return;
  shared.links = next;
  saveStore();
  notifyStore();
}
