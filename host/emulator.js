import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { adbErrorHint, runAdb } from './adb.js';
import { execFileAsync } from './config.js';
import { delay } from './util.js';

function resolveEmulatorBinary() {
  const candidates = [];
  for (const key of ['ANDROID_HOME', 'ANDROID_SDK_ROOT']) {
    const root = process.env[key];
    if (root) candidates.push(path.join(root, 'emulator', process.platform === 'win32' ? 'emulator.exe' : 'emulator'));
  }
  candidates.push(
    path.join(os.homedir(), 'Library/Android/sdk/emulator/emulator'),
    path.join(os.homedir(), 'Android/Sdk/emulator/emulator'),
    '/usr/local/share/android-sdk/emulator/emulator',
    '/opt/homebrew/share/android-sdk/emulator/emulator',
  );
  if (process.platform === 'win32') {
    const local = process.env.LOCALAPPDATA || '';
    candidates.push(path.join(local, 'Android/Sdk/emulator/emulator.exe'));
  }
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      /* ignore */
    }
  }
  return null;
}

export async function listAvds() {
  const binary = resolveEmulatorBinary();
  if (!binary) {
    return { available: false, avds: [], message: '未找到 Android emulator。请安装 Android Studio 或 SDK 工具。' };
  }
  try {
    const { stdout } = await execFileAsync(binary, ['-list-avds'], { timeout: 10_000, maxBuffer: 2 * 1024 * 1024 });
    const avds = String(stdout)
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('INFO'));
    return { available: true, avds };
  } catch (error) {
    return { available: false, avds: [], message: error.message };
  }
}

export async function launchAvd(name) {
  const clean = String(name || '').trim();
  if (!clean || /[\r\n]/.test(clean)) throw new Error('模拟器名称不正确');
  const binary = resolveEmulatorBinary();
  if (!binary) throw new Error('未找到 Android emulator。请安装 Android Studio 或 SDK 工具。');
  return new Promise((resolve, reject) => {
    let settled = false;
    const child = spawn(binary, ['-avd', clean, '-netdelay', 'none', '-netspeed', 'full', '-no-window'], {
      detached: true,
      stdio: 'ignore',
    });
    child.once('error', (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    });
    child.once('spawn', () => {
      if (settled) return;
      settled = true;
      child.unref();
      resolve({ success: true, message: `正在启动 ${clean}，约需 20–60 秒` });
    });
  });
}

function parseElapsedSeconds(etime) {
  const [daysPart, clockPart] = String(etime).includes('-') ? String(etime).split('-') : ['0', String(etime)];
  const days = Number(daysPart) || 0;
  const segments = clockPart.split(':').map((segment) => Number(segment) || 0);
  while (segments.length < 3) segments.unshift(0);
  const [hours, minutes, seconds] = segments.slice(-3);
  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

export async function runningEmulatorProcesses() {
  if (process.platform === 'win32') return [];
  try {
    const { stdout } = await execFileAsync('ps', ['-ax', '-o', 'pid=,etime=,command='], {
      timeout: 6000,
      maxBuffer: 8 * 1024 * 1024,
    });
    const processes = [];
    for (const rawLine of String(stdout).split('\n')) {
      const line = rawLine.trim();
      if (!line.includes('-avd ')) continue;
      if (!line.includes('qemu-system') && !line.includes('/emulator/')) continue;
      const match = line.match(/^(\d+)\s+(\S+)\s+(.*)$/);
      if (!match) continue;
      const avd = match[3].match(/-avd\s+(\S+)/)?.[1];
      if (!avd) continue;
      processes.push({
        pid: Number(match[1]),
        uptimeSeconds: parseElapsedSeconds(match[2]),
        avd,
        serial: '',
      });
    }
    return processes;
  } catch {
    return [];
  }
}

const avdNameCache = new Map();

export async function avdNameForSerial(serial) {
  const cached = avdNameCache.get(serial);
  if (cached && Date.now() - cached.at < 60_000) return cached.name;
  try {
    const { stdout } = await runAdb(['-s', serial, 'emu', 'avd', 'name'], { timeout: 2500 });
    const name = String(stdout).split('\n').map((line) => line.trim()).find(Boolean) || '';
    if (name && name !== 'OK' && !/^KO$/i.test(name)) {
      avdNameCache.set(serial, { name, at: Date.now() });
      return name;
    }
  } catch {
    /* still booting */
  }
  return '';
}

export async function stopEmulator({ serial, pid }) {
  if (serial) {
    try {
      await runAdb(['-s', serial, 'emu', 'kill'], { timeout: 8000 });
      return { success: true, message: `已请求关闭 ${serial}` };
    } catch (error) {
      if (!pid) throw new Error(adbErrorHint(error));
    }
  }
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('缺少模拟器进程号');
  try {
    process.kill(pid, 'SIGTERM');
    await delay(1200);
    try {
      process.kill(pid, 0);
      process.kill(pid, 'SIGKILL');
    } catch {
      /* already exited */
    }
    return { success: true, message: '模拟器已停止' };
  } catch (error) {
    throw new Error(error.message || '停止模拟器失败');
  }
}

export async function connectWifiDevice(address) {
  const clean = String(address || '').trim();
  if (!clean || !/^[A-Za-z0-9._:-]+$/.test(clean)) throw new Error('请输入正确的设备地址，例如 192.168.1.102:5555');
  const finalAddress = clean.includes(':') ? clean : `${clean}:5555`;
  const { stdout, stderr } = await runAdb(['connect', finalAddress], { timeout: 12_000 });
  const output = String(stdout || stderr || '').trim();
  const success = /connected to/i.test(output) && !/unable|failed|cannot/i.test(output);
  return { success, message: output || '连接超时或被拒绝' };
}
