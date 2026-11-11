import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileAsync, SERIAL_RE } from './config.js';
import { state } from './state.js';

let adbPathCache;

export function resolveAdb() {
  if (adbPathCache !== undefined) return adbPathCache;
  const candidates = [];
  if (process.env.DSH_DEVICE_MIRROR_ADB) candidates.push(process.env.DSH_DEVICE_MIRROR_ADB);
  candidates.push(
    '/opt/homebrew/bin/adb',
    '/usr/local/bin/adb',
    '/usr/bin/adb',
    path.join(os.homedir(), 'Library/Android/sdk/platform-tools/adb'),
    path.join(os.homedir(), 'Android/Sdk/platform-tools/adb'),
    path.join(os.homedir(), '.local/bin/adb'),
  );
  if (process.platform === 'win32') {
    const local = process.env.LOCALAPPDATA || '';
    candidates.push(
      path.join(local, 'Android/Sdk/platform-tools/adb.exe'),
      path.join(local, 'Android/Sdk/platform-tools/adb'),
      'adb.exe',
    );
  }
  for (const candidate of candidates) {
    if (!candidate.includes(path.sep)) continue;
    try {
      if (fs.existsSync(candidate)) {
        adbPathCache = candidate;
        return candidate;
      }
    } catch {
      /* ignore */
    }
  }
  adbPathCache = process.platform === 'win32' ? 'adb.exe' : 'adb';
  return adbPathCache;
}

export function runAdb(args, options = {}) {
  return execFileAsync(resolveAdb(), args, {
    timeout: options.timeout ?? 8000,
    encoding: options.encoding ?? 'utf8',
    maxBuffer: options.maxBuffer ?? 8 * 1024 * 1024,
    windowsHide: true,
  });
}

export function adbErrorHint(error) {
  const text = String(error?.stderr || error?.message || '');
  if (/not found|ENOENT|spawn/i.test(text)) {
    return '未找到 adb。请安装 Android platform-tools，或设置环境变量 DSH_DEVICE_MIRROR_ADB。';
  }
  if (/no devices|device not found/i.test(text)) return '设备已断开。';
  if (/unauthorized/i.test(text)) return '设备未授权。请在手机上确认 USB 调试授权。';
  return text.split('\n').map((line) => line.trim()).find(Boolean) || 'ADB 调用失败';
}

export async function adbStatus() {
  try {
    const { stdout } = await runAdb(['version'], { timeout: 4000 });
    const first = String(stdout).split('\n').map((line) => line.trim()).find(Boolean) || '';
    return { available: true, path: resolveAdb(), version: first };
  } catch (error) {
    return { available: false, path: resolveAdb(), error: adbErrorHint(error) };
  }
}

export async function listDevices() {
  const { stdout } = await runAdb(['devices', '-l'], { timeout: 6000 });
  const devices = [];
  for (const line of String(stdout).split('\n')) {
    const text = line.trim();
    if (!text || text.startsWith('List of devices') || text.startsWith('*')) continue;
    const parts = text.split(/\s+/);
    const serial = parts.shift();
    const deviceState = parts.shift();
    if (!serial || !deviceState) continue;
    const props = {};
    for (const token of parts) {
      const index = token.indexOf(':');
      if (index > 0) props[token.slice(0, index)] = token.slice(index + 1);
    }
    devices.push({
      serial,
      state: deviceState,
      model: props.model || '',
      product: props.product || '',
      device: props.device || '',
      transportId: props.transport_id || '',
      isEmulator:
        serial.startsWith('emulator-') ||
        props.product === 'sdk' ||
        String(props.device || '').startsWith('emu'),
    });
  }
  return devices;
}

export async function resolveSerial(requested) {
  if (requested !== undefined && requested !== null && String(requested).trim() !== '') {
    const text = String(requested).trim();
    if (!SERIAL_RE.test(text)) throw new Error('设备串号格式不正确');
  }
  const devices = await listDevices();
  const online = devices.filter((device) => device.state === 'device');
  if (requested) {
    const found = online.find((device) => device.serial === requested);
    if (!found) throw new Error(`设备不在线：${requested}`);
    return requested;
  }
  if (state.lastSerial) {
    const preferred = online.find((device) => device.serial === state.lastSerial);
    if (preferred) return preferred.serial;
  }
  if (!online.length) throw new Error('没有在线的 Android 设备。请连接 USB 并开启调试，或启动模拟器。');
  return online[0].serial;
}
