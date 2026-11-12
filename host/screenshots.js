import fsp from 'node:fs/promises';
import path from 'node:path';
import { runAdb } from './adb.js';
import { MAX_SHOTS, SHOT_DIR } from './config.js';
import { saveState, state } from './state.js';
import { safeSerial } from './util.js';

function pngSize(buffer) {
  if (buffer.length < 24 || buffer[0] !== 0x89 || buffer[1] !== 0x50) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

export async function readShotMeta(filePath) {
  const stat = await fsp.stat(filePath);
  const handle = await fsp.open(filePath, 'r');
  try {
    const head = Buffer.alloc(24);
    await handle.read(head, 0, 24, 0);
    const size = pngSize(head) || { width: 0, height: 0 };
    return {
      path: filePath,
      name: path.basename(filePath),
      at: stat.mtimeMs,
      bytes: stat.size,
      width: size.width,
      height: size.height,
      selected: state.selected === filePath,
    };
  } finally {
    await handle.close();
  }
}

export async function captureShot(serial) {
  const { stdout } = await runAdb(['-s', serial, 'exec-out', 'screencap', '-p'], {
    encoding: 'buffer',
    maxBuffer: 64 * 1024 * 1024,
    timeout: 20_000,
  });
  const buffer = Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout);
  if (buffer.length < 24 || buffer[0] !== 0x89) throw new Error('设备截图失败：返回内容不是 PNG');
  const filePath = path.join(SHOT_DIR, `device-${safeSerial(serial)}-${Date.now()}.png`);
  await fsp.writeFile(filePath, buffer);
  state.selected = filePath;
  state.lastSerial = serial;
  saveState();
  return readShotMeta(filePath);
}

export async function listShots(serial, limit = MAX_SHOTS) {
  let names = [];
  try {
    names = await fsp.readdir(SHOT_DIR);
  } catch {
    return [];
  }
  const prefix = serial ? `device-${safeSerial(serial)}-` : 'device-';
  const files = names.filter((name) => name.startsWith(prefix) && name.endsWith('.png'));
  const items = [];
  for (const name of files) {
    try {
      items.push(await readShotMeta(path.join(SHOT_DIR, name)));
    } catch {
      /* skip unreadable */
    }
  }
  items.sort((a, b) => b.at - a.at);
  return limit === Infinity ? items : items.slice(0, limit);
}

export async function pruneShots(serial) {
  const items = await listShots(serial, Infinity);
  if (items.length <= MAX_SHOTS) return;
  for (const item of items.slice(MAX_SHOTS)) {
    if (item.path === state.selected) continue;
    try {
      await fsp.unlink(item.path);
    } catch {
      /* ignore */
    }
  }
}

export async function deleteShot(filePath) {
  const resolved = path.resolve(String(filePath || ''));
  if (!resolved.startsWith(SHOT_DIR + path.sep)) throw new Error('截图路径不在设备台目录内');
  await fsp.unlink(resolved);
  if (state.selected === resolved) {
    state.selected = null;
    saveState();
  }
  return resolved;
}

export async function clearShots() {
  let names = [];
  try {
    names = await fsp.readdir(SHOT_DIR);
  } catch {
    return { removed: 0 };
  }
  let removed = 0;
  for (const name of names) {
    if (!name.startsWith('device-') || !name.endsWith('.png')) continue;
    try {
      await fsp.unlink(path.join(SHOT_DIR, name));
      removed += 1;
    } catch {
      /* skip files still in use */
    }
  }
  if (state.selected) {
    try {
      await fsp.stat(state.selected);
    } catch {
      state.selected = null;
      saveState();
    }
  }
  return { removed };
}

export async function selectShot(filePath) {
  const resolved = path.resolve(String(filePath || ''));
  if (!resolved.startsWith(SHOT_DIR + path.sep)) throw new Error('截图路径不在设备台目录内');
  const item = await readShotMeta(resolved);
  state.selected = resolved;
  saveState();
  return { ...item, selected: true };
}

export async function pickShot(serial) {
  if (state.selected) {
    try {
      const selected = await readShotMeta(state.selected);
      if (!serial || selected.name.startsWith(`device-${safeSerial(serial)}-`)) return selected;
    } catch {
      /* selected was deleted */
    }
  }
  const items = await listShots(serial);
  return items[0] || null;
}
