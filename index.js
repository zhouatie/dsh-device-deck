import { execFile, spawn } from 'node:child_process';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { promisify } from 'node:util';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Adb, AdbServerClient } from '@yume-chan/adb';
import { AdbServerNodeTcpConnector } from '@yume-chan/adb-server-node-tcp';
import { AdbScrcpyClient, AdbScrcpyOptions3_3_3 } from '@yume-chan/adb-scrcpy';
import { AndroidScreenPowerMode } from '@yume-chan/scrcpy';

const execFileAsync = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));

const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
const DATA_DIR = path.join(DSH_HOME, 'device-deck');
const SHOT_DIR = path.join(DATA_DIR, 'screenshots');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const SERVER_BIN = path.join(HERE, 'bin', 'scrcpy-server');
const REMOTE_SERVER = '/data/local/tmp/dsh-device-deck-scrcpy.jar';
const REMOTE_UPLOAD_DIR = '/sdcard/Download';

const MAX_SHOTS = 30;
const IDLE_TEARDOWN_MS = 30_000;
const MAX_SUBSCRIBER_BACKLOG = 1024 * 1024;
const MAX_GOP_BYTES = 8 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;

const T_META = 1;
const T_CONFIG = 2;
const T_DATA = 3;
const T_ERROR = 4;
const T_END = 5;

const SERIAL_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

const state = {
  selected: null,
  lastSerial: null,
};

let adbPathCache;

function ensureDirs() {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  loadState();
}

function loadState() {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (typeof parsed?.selected === 'string') state.selected = parsed.selected;
    if (typeof parsed?.lastSerial === 'string') state.lastSerial = parsed.lastSerial;
  } catch {
    /* first run */
  }
}

function saveState() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = `${STATE_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
    fs.renameSync(tmp, STATE_FILE);
  } catch {
    /* state is best effort */
  }
}

function resolveAdb() {
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

function runAdb(args, options = {}) {
  return execFileAsync(resolveAdb(), args, {
    timeout: options.timeout ?? 8000,
    encoding: options.encoding ?? 'utf8',
    maxBuffer: options.maxBuffer ?? 8 * 1024 * 1024,
    windowsHide: true,
  });
}

function adbErrorHint(error) {
  const text = String(error?.stderr || error?.message || '');
  if (/not found|ENOENT|spawn/i.test(text)) {
    return '未找到 adb。请安装 Android platform-tools，或设置环境变量 DSH_DEVICE_MIRROR_ADB。';
  }
  if (/no devices|device not found/i.test(text)) return '设备已断开。';
  if (/unauthorized/i.test(text)) return '设备未授权。请在手机上确认 USB 调试授权。';
  return text.split('\n').map((line) => line.trim()).find(Boolean) || 'ADB 调用失败';
}

async function adbStatus() {
  try {
    const { stdout } = await runAdb(['version'], { timeout: 4000 });
    const first = String(stdout).split('\n').map((line) => line.trim()).find(Boolean) || '';
    return { available: true, path: resolveAdb(), version: first };
  } catch (error) {
    return { available: false, path: resolveAdb(), error: adbErrorHint(error) };
  }
}

async function listDevices() {
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

async function resolveSerial(requested) {
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


function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

async function listAvds() {
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

async function launchAvd(name) {
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

async function runningEmulatorProcesses() {
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

async function avdNameForSerial(serial) {
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

async function stopEmulator({ serial, pid }) {
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

async function connectWifiDevice(address) {
  const clean = String(address || '').trim();
  if (!clean || !/^[A-Za-z0-9._:-]+$/.test(clean)) throw new Error('请输入正确的设备地址，例如 192.168.1.102:5555');
  const finalAddress = clean.includes(':') ? clean : `${clean}:5555`;
  const { stdout, stderr } = await runAdb(['connect', finalAddress], { timeout: 12_000 });
  const output = String(stdout || stderr || '').trim();
  const success = /connected to/i.test(output) && !/unable|failed|cannot/i.test(output);
  return { success, message: output || '连接超时或被拒绝' };
}

function isMacOS() {
  return process.platform === 'darwin';
}

async function listIosSimulators() {
  if (!isMacOS()) {
    return { available: false, message: 'iOS 模拟器仅支持 macOS。', running: [], pending: [] };
  }
  try {
    const { stdout } = await execFileAsync('xcrun', ['simctl', 'list', 'devices', 'available', '--json'], {
      timeout: 20_000,
      maxBuffer: 8 * 1024 * 1024,
    });
    const data = JSON.parse(String(stdout));
    const seen = new Set();
    const all = [];
    for (const [runtime, simulators] of Object.entries(data.devices || {})) {
      const version = String(runtime).match(/iOS-([\d-]+)$/)?.[1]?.replace(/-/g, '.') || '';
      for (const simulator of simulators || []) {
        if (simulator.isAvailable === false || seen.has(simulator.udid)) continue;
        seen.add(simulator.udid);
        all.push({
          udid: simulator.udid,
          name: simulator.name,
          state: simulator.state,
          version,
        });
      }
    }
    const versionScore = (version) => {
      const parts = String(version || '0').split('.').map((part) => Number(part) || 0);
      return (parts[0] || 0) * 10_000 + (parts[1] || 0) * 100 + (parts[2] || 0);
    };
    const byName = new Map();
    for (const simulator of all) {
      const previous = byName.get(simulator.name);
      if (!previous) {
        byName.set(simulator.name, simulator);
        continue;
      }
      const score = (item) => (item.state === 'Booted' ? 1 : 0) * 1_000_000 + versionScore(item.version);
      if (score(simulator) > score(previous)) byName.set(simulator.name, simulator);
    }
    const unique = [...byName.values()];
    const rank = (name) => {
      if (String(name).startsWith('iPhone')) return 0;
      if (String(name).startsWith('iPad')) return 1;
      if (String(name).startsWith('Apple TV')) return 2;
      if (String(name).startsWith('Apple Watch')) return 3;
      return 4;
    };
    const running = unique.filter((item) => item.state === 'Booted');
    const pending = unique
      .filter((item) => item.state !== 'Booted')
      .sort((a, b) => rank(a.name) - rank(b.name) || String(a.name).localeCompare(String(b.name)));
    return { available: true, running, pending };
  } catch (error) {
    return { available: false, message: error.message, running: [], pending: [] };
  }
}

async function bootIosSimulator(udid) {
  if (!isMacOS()) throw new Error('iOS 模拟器仅支持 macOS。');
  const clean = String(udid || '').trim();
  if (!/^[A-Za-z0-9-]{8,64}$/.test(clean)) throw new Error('模拟器 UDID 不正确');
  try {
    await execFileAsync('xcrun', ['simctl', 'boot', clean], { timeout: 30_000 });
  } catch (error) {
    const message = String(error.stderr || error.message || '');
    if (!/Booted|current state/i.test(message)) throw new Error(message || '启动 iOS 模拟器失败');
  }
  try {
    await execFileAsync('open', ['-a', 'Simulator'], { timeout: 10_000 });
  } catch {
    /* the device can still boot headless */
  }
  return { success: true, message: '已启动 iOS 模拟器' };
}

async function shutdownIosSimulator(udid) {
  if (!isMacOS()) throw new Error('iOS 模拟器仅支持 macOS。');
  const clean = String(udid || '').trim();
  if (!/^[A-Za-z0-9-]{8,64}$/.test(clean)) throw new Error('模拟器 UDID 不正确');
  try {
    await execFileAsync('xcrun', ['simctl', 'shutdown', clean], { timeout: 20_000 });
  } catch (error) {
    const message = String(error.stderr || error.message || '');
    if (!/current state|Shutdown/i.test(message)) throw new Error(message || '关闭 iOS 模拟器失败');
  }
  return { success: true, message: '已关闭 iOS 模拟器' };
}

async function openIosSimulator() {
  if (!isMacOS()) throw new Error('iOS 模拟器仅支持 macOS。');
  await execFileAsync('open', ['-a', 'Simulator'], { timeout: 10_000 });
  return { success: true, message: '已打开 Simulator' };
}

async function handleInventory(req, res) {
  const [adbResult, devicesResult, avdsResult, runningResult, iosResult] = await Promise.allSettled([
    adbStatus(),
    listDevices(),
    listAvds(),
    runningEmulatorProcesses(),
    listIosSimulators(),
  ]);
  const adb = adbResult.status === 'fulfilled' ? adbResult.value : { available: false, error: adbErrorHint(adbResult.reason) };
  const devices = devicesResult.status === 'fulfilled' ? devicesResult.value : [];
  const avds = avdsResult.status === 'fulfilled' ? avdsResult.value : { available: false, avds: [], message: adbErrorHint(avdsResult.reason) };
  const processes = runningResult.status === 'fulfilled' ? runningResult.value : [];
  const ios = iosResult.status === 'fulfilled' ? iosResult.value : { available: false, message: '读取 iOS 模拟器失败', running: [], pending: [] };

  const online = devices.filter((device) => device.state === 'device');
  const emulators = online.filter((device) => device.isEmulator);
  const realDevices = online.filter((device) => !device.isEmulator);
  const avdPairs = await Promise.all(emulators.map(async (device) => ({ serial: device.serial, avd: await avdNameForSerial(device.serial) })));
  const avdBySerial = new Map(avdPairs.map((pair) => [pair.serial, pair.avd]));

  const running = [];
  for (const device of emulators) {
    const avd = avdBySerial.get(device.serial) || '';
    const process = processes.find((item) => item.serial === device.serial) || (avd ? processes.find((item) => item.avd === avd) : undefined);
    running.push({
      platform: 'android',
      name: avd || device.model || device.serial,
      serial: device.serial,
      avd,
      pid: process?.pid ?? null,
      state: 'booted',
      kind: '模拟器',
      uptimeSeconds: process?.uptimeSeconds ?? null,
    });
  }
  for (const process of processes) {
    if (process.serial && running.some((item) => item.serial === process.serial)) continue;
    if (running.some((item) => item.avd === process.avd)) continue;
    running.push({
      platform: 'android',
      name: process.avd,
      serial: '',
      avd: process.avd,
      pid: process.pid,
      state: 'starting',
      kind: '模拟器',
      uptimeSeconds: process.uptimeSeconds,
    });
  }
  for (const device of realDevices) {
    running.push({
      platform: 'android',
      name: device.model || device.serial,
      serial: device.serial,
      avd: '',
      pid: null,
      state: 'booted',
      kind: '真机',
      uptimeSeconds: null,
    });
  }
  running.sort((a, b) => {
    if (a.state !== b.state) return a.state === 'booted' ? -1 : 1;
    const rank = (item) => (item.kind === '模拟器' ? 0 : 1);
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    return String(a.name).localeCompare(String(b.name));
  });

  const runningAvds = new Set(running.map((item) => item.avd).filter(Boolean));
  const pending = (avds.avds || []).filter((name) => !runningAvds.has(name));

  sendJson(res, 200, {
    adb,
    android: {
      running,
      avds: {
        available: Boolean(avds.available),
        items: avds.avds || [],
        pending,
        message: avds.message,
      },
    },
    ios,
  });
}

async function handleEmulatorStart(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  const body = await readJson(req);
  const result = await launchAvd(body.name);
  sendJson(res, 200, result);
}

async function handleEmulatorStop(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  const body = await readJson(req);
  const result = await stopEmulator({ serial: body.serial, pid: body.pid });
  sendJson(res, 200, result);
}

async function handleWifiConnect(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  const body = await readJson(req);
  const result = await connectWifiDevice(body.address);
  sendJson(res, 200, result);
}

async function handleIosBoot(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  const body = await readJson(req);
  const result = await bootIosSimulator(body.udid);
  sendJson(res, 200, result);
}

async function handleIosShutdown(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  const body = await readJson(req);
  const result = await shutdownIosSimulator(body.udid);
  sendJson(res, 200, result);
}

async function handleIosOpen(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  await readJson(req);
  const result = await openIosSimulator();
  sendJson(res, 200, result);
}

const sizeCache = new Map();

async function displaySize(serial) {
  if (sizeCache.has(serial)) return sizeCache.get(serial);
  const { stdout } = await runAdb(['-s', serial, 'shell', 'wm', 'size'], { timeout: 4000 });
  const text = String(stdout);
  const override = text.match(/Override size:\s*(\d+)x(\d+)/i);
  const physical = text.match(/Physical size:\s*(\d+)x(\d+)/i);
  const match = override || physical;
  if (!match) throw new Error('无法读取设备分辨率');
  const size = { width: Number(match[1]), height: Number(match[2]) };
  sizeCache.set(serial, size);
  return size;
}

function toAdbInputText(text) {
  return String(text).replace(/([\\"'$`&|;<>()[\]{}*?!#~])|\s/g, (match, special) =>
    special ? `\\${special}` : '%s',
  );
}

const serialChains = new Map();

function serializeAction(serial, task) {
  const previous = serialChains.get(serial) || Promise.resolve();
  const next = previous.then(task, task);
  serialChains.set(serial, next.catch(() => undefined));
  return next;
}

async function executeAction(serial, action) {
  const type = String(action?.type || '');
  return serializeAction(serial, async () => {
    switch (type) {
      case 'tap': {
        const size = await orientedSize(serial, action);
        const x = Math.round(clamp01(action.ratioX) * size.width);
        const y = Math.round(clamp01(action.ratioY) * size.height);
        await runAdb(['-s', serial, 'shell', 'input', 'tap', String(x), String(y)], { timeout: 5000 });
        return { success: true };
      }
      case 'swipe': {
        const size = await orientedSize(serial, action);
        const x1 = Math.round(clamp01(action.ratioX) * size.width);
        const y1 = Math.round(clamp01(action.ratioY) * size.height);
        const x2 = Math.round(clamp01(action.ratioEndX) * size.width);
        const y2 = Math.round(clamp01(action.ratioEndY) * size.height);
        const duration = Math.max(100, Math.min(1200, Math.round(Number(action.duration) || 260)));
        await runAdb(
          ['-s', serial, 'shell', 'input', 'swipe', String(x1), String(y1), String(x2), String(y2), String(duration)],
          { timeout: 6000 },
        );
        return { success: true };
      }
      case 'key': {
        const keyMap = { back: 4, home: 3, power: 26, enter: 66, menu: 82, volumeup: 24, volumedown: 25 };
        const code = keyMap[String(action.key || '').toLowerCase()] || 4;
        await runAdb(['-s', serial, 'shell', 'input', 'keyevent', String(code)], { timeout: 5000 });
        return { success: true };
      }
      case 'text': {
        const text = String(action.text || '');
        if (!text) throw new Error('输入文本为空');
        if (!/^[\x20-\x7E]*$/.test(text)) {
          throw new Error('ADB 输入仅支持英文、数字与常见符号。中文请用系统输入法。');
        }
        await runAdb(['-s', serial, 'shell', 'input', 'text', toAdbInputText(text)], { timeout: 8000 });
        return { success: true };
      }
      case 'openUrl': {
        const url = String(action.url || '').trim();
        if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) throw new Error('链接需要带协议，例如 https:// 或 app://');
        await runAdb(
          ['-s', serial, 'shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', url],
          { timeout: 8000 },
        );
        return { success: true };
      }
      default:
        throw new Error(`不支持的动作：${type}`);
    }
  });
}

function clamp01(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}

async function orientedSize(serial, action) {
  const size = await displaySize(serial);
  const frameWidth = Number(action?.frameWidth);
  const frameHeight = Number(action?.frameHeight);
  if (frameWidth > 0 && frameHeight > 0 && (frameWidth > frameHeight) !== (size.width > size.height)) {
    return { width: size.height, height: size.width };
  }
  return size;
}

function safeSerial(serial) {
  return String(serial).replace(/[^A-Za-z0-9._-]/g, '_');
}

function pngSize(buffer) {
  if (buffer.length < 24 || buffer[0] !== 0x89 || buffer[1] !== 0x50) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function readShotMeta(filePath) {
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

async function captureShot(serial) {
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

async function listShots(serial, limit = MAX_SHOTS) {
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

async function pruneShots(serial) {
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

async function selectShot(filePath) {
  const resolved = path.resolve(String(filePath || ''));
  if (!resolved.startsWith(SHOT_DIR + path.sep)) throw new Error('截图路径不在设备台目录内');
  const item = await readShotMeta(resolved);
  state.selected = resolved;
  saveState();
  return { ...item, selected: true };
}

async function pickShot(serial) {
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

function encodeFrame(type, flags, payload) {
  const body = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
  const frame = Buffer.allocUnsafe(6 + body.length);
  frame[0] = type;
  frame[1] = flags;
  frame.writeUInt32BE(body.length, 2);
  body.copy(frame, 6);
  return frame;
}

function jsonFrame(type, value) {
  return encodeFrame(type, 0, Buffer.from(JSON.stringify(value)));
}

class StreamSession {
  constructor(serial, onDestroy) {
    this.serial = serial;
    this.onDestroy = onDestroy;
    this.clients = new Set();
    this.scrcpyClient = null;
    this.starting = null;
    this.destroyed = false;
    this.metadata = null;
    this.configPacket = null;
    this.screenOff = false;
    this.gop = [];
    this.gopBytes = 0;
    this.gopComplete = false;
    this.gopWaiters = new Set();
    this.idleTimer = null;
  }

  async subscribe(client) {
    if (this.destroyed) throw new Error('流会话已结束');
    this.clients.add(client);
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    if (this.metadata) this.sendMetaTo(client);
    await this.ensureStarted();
  }

  unsubscribe(client) {
    this.clients.delete(client);
    if (this.clients.size === 0 && !this.destroyed) {
      void this.restoreScreen();
      this.scheduleIdle();
    }
  }

  scheduleIdle() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      this.destroy().catch(() => undefined);
    }, IDLE_TEARDOWN_MS);
  }

  ensureStarted() {
    if (this.scrcpyClient) return Promise.resolve();
    if (this.starting) return this.starting;
    this.starting = this.start().finally(() => {
      this.starting = null;
    });
    return this.starting;
  }

  async start() {
    if (!fs.existsSync(SERVER_BIN)) throw new Error('缺少 scrcpy-server 二进制文件');
    await runAdb(['-s', this.serial, 'push', SERVER_BIN, REMOTE_SERVER], { timeout: 20_000 });

    const connector = new AdbServerNodeTcpConnector({ host: '127.0.0.1', port: 5037 });
    const server = new AdbServerClient(connector);
    const devices = await server.getDevices();
    const target = devices.find((device) => device.serial === this.serial);
    if (!target) throw new Error(`ADB 服务中未检测到设备：${this.serial}`);
    const adb = new Adb(await server.createTransport(target));

    const options = new AdbScrcpyOptions3_3_3({
      audio: false,
      control: true,
      maxSize: 1080,
      sendFrameMeta: true,
      videoBitRate: 3_000_000,
      stayAwake: true,
    });
    const client = await AdbScrcpyClient.start(adb, REMOTE_SERVER, options);
    if (this.destroyed) {
      try {
        await client.close();
      } catch {
        /* ignore */
      }
      return;
    }
    this.scrcpyClient = client;

    const video = await client.videoStream;
    const meta = video.metadata || {};
    const rawCodec = meta.codec;
    const isH265 = rawCodec === 1748121141 || String(rawCodec).toLowerCase().includes('h265');
    this.metadata = {
      serial: this.serial,
      deviceName: meta.deviceName || this.serial,
      codec: isH265 ? 'h265' : 'h264',
      width: meta.width || 1080,
      height: meta.height || 1920,
    };

    const controller = client.controller;
    if (controller) {
      try {
        await controller.setScreenPowerMode(AndroidScreenPowerMode.Off);
        this.screenOff = true;
      } catch (error) {
        console.warn('[device-deck] unable to turn the physical screen off', error);
      }
    }

    for (const subscriber of this.clients) this.sendMetaTo(subscriber);
    void this.consume(video.stream).catch((error) => {
      this.broadcastError(error?.message || '视频流异常');
      void this.destroy();
    });
  }

  async consume(stream) {
    const reader = stream.getReader();
    try {
      while (!this.destroyed) {
        const { done, value } = await reader.read();
        if (done) {
          this.broadcast(jsonFrame(T_END, { message: '设备画面已中断' }));
          break;
        }
        if (!value) continue;
        const isConfig = value.type === 'configuration';
        const isKey = Boolean(value.keyframe);
        const payload = Buffer.from(value.data.buffer, value.data.byteOffset, value.data.byteLength);
        if (isConfig) {
          this.configPacket = payload;
          this.gop = [];
          this.gopBytes = 0;
          this.gopComplete = false;
        } else if (isKey) {
          this.gop = [{ flags: 1, payload }];
          this.gopBytes = payload.length;
          this.gopComplete = true;
          for (const done of [...this.gopWaiters]) done(true);
          this.gopWaiters.clear();
        } else if (this.gopComplete) {
          this.gop.push({ flags: 0, payload });
          this.gopBytes += payload.length;
          if (this.gopBytes > MAX_GOP_BYTES) {
            this.gop = [];
            this.gopBytes = 0;
            this.gopComplete = false;
          }
        }
        const flags = isKey ? 1 : 0;
        for (const subscriber of this.clients) {
          if (subscriber.closed) continue;
          subscriber.write(isConfig ? T_CONFIG : T_DATA, flags, payload);
        }
      }
    } finally {
      try {
        reader.releaseLock();
      } catch {
        /* ignore */
      }
      await this.destroy();
    }
  }

  sendMetaTo(client) {
    if (!this.metadata || client.closed) return;
    client.write(T_META, 0, Buffer.from(JSON.stringify(this.metadata)));
    if (this.configPacket) client.write(T_CONFIG, 0, this.configPacket);
    if (!this.gopComplete || this.gop.length === 0) return;
    client.replaying = true;
    try {
      for (const frame of this.gop) {
        if (client.closed) break;
        client.write(T_DATA, frame.flags, frame.payload);
      }
    } finally {
      client.replaying = false;
    }
  }

  waitForGop(timeout = 5000) {
    if (this.gopComplete) return Promise.resolve(true);
    return new Promise((resolve) => {
      const done = (ready) => {
        clearTimeout(timer);
        this.gopWaiters.delete(done);
        resolve(ready);
      };
      const timer = setTimeout(() => done(false), timeout);
      this.gopWaiters.add(done);
    });
  }

  broadcast(frame) {
    for (const subscriber of this.clients) {
      if (!subscriber.closed) subscriber.writeRaw(frame);
    }
  }

  broadcastError(message) {
    this.broadcast(jsonFrame(T_ERROR, { message }));
  }

  async restoreScreen() {
    if (!this.screenOff || !this.scrcpyClient) return;
    const controller = this.scrcpyClient.controller;
    if (!controller) return;
    try {
      await controller.setScreenPowerMode(AndroidScreenPowerMode.Normal);
      this.screenOff = false;
    } catch {
      /* keep the flag so destroy can retry */
    }
  }

  async destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    if (this.starting) {
      try {
        await this.starting;
      } catch {
        /* ignore */
      }
    }
    for (const done of [...this.gopWaiters]) done(false);
    this.gopWaiters.clear();
    try {
      this.onDestroy?.();
    } catch {
      /* ignore */
    }
    await this.restoreScreen();
    if (this.scrcpyClient) {
      try {
        await this.scrcpyClient.close();
      } catch {
        /* ignore */
      }
      this.scrcpyClient = null;
    }
    for (const subscriber of this.clients) {
      try {
        subscriber.end();
      } catch {
        /* ignore */
      }
    }
    this.clients.clear();
  }
}

const hub = {
  sessions: new Map(),
  async subscribe(serial, client) {
    let session = this.sessions.get(serial);
    if (session && !session.destroyed) {
      if (session.clients.size === 0) {
        await session.destroy();
        session = null;
      } else if (!session.gopComplete) {
        const ready = await session.waitForGop(5000);
        if (!ready) {
          client.writeError('画面正在重建，请稍后重试');
          client.end();
          return;
        }
      }
    }
    if (!session || session.destroyed) {
      session = new StreamSession(serial, () => this.sessions.delete(serial));
      this.sessions.set(serial, session);
    }
    try {
      await session.subscribe(client);
    } catch (error) {
      client.writeError(adbErrorHint(error));
      client.end();
      session.unsubscribe(client);
      await session.destroy();
      throw error;
    }
  },
  unsubscribe(serial, client) {
    this.sessions.get(serial)?.unsubscribe(client);
  },
  async destroyAll() {
    const list = [...this.sessions.values()];
    this.sessions.clear();
    await Promise.allSettled(list.map((session) => session.destroy()));
  },
};

function streamClient(res) {
  return {
    res,
    closed: false,
    replaying: false,
    write(type, flags, payload) {
      if (this.closed || res.writableEnded) return;
      if (!this.replaying && type === T_DATA && (flags & 1) === 0 && res.writableLength > MAX_SUBSCRIBER_BACKLOG) {
        this.closed = true;
        try {
          res.end();
        } catch {
          /* ignore */
        }
        return;
      }
      try {
        res.write(encodeFrame(type, flags, payload));
      } catch {
        this.closed = true;
      }
    },
    writeRaw(frame) {
      if (this.closed || res.writableEnded) return;
      try {
        res.write(frame);
      } catch {
        this.closed = true;
      }
    },
    writeError(message) {
      this.write(T_ERROR, 0, Buffer.from(JSON.stringify({ message })));
    },
    end() {
      if (this.closed) return;
      this.closed = true;
      try {
        res.end();
      } catch {
        /* ignore */
      }
    },
  };
}

async function readJson(req, limit = 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error('请求体过大');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function sendJson(res, status, value) {
  const body = Buffer.from(JSON.stringify(value));
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function routePath(req) {
  return new URL(req.url || '/', 'http://127.0.0.1').pathname;
}

function routeQuery(req) {
  return new URL(req.url || '/', 'http://127.0.0.1').searchParams;
}

function sanitizeUploadName(value) {
  const base = path.basename(String(value || '').replace(/\\/g, '/')).trim();
  const cleaned = base
    .replace(/[\u0000-\u001f<>:"/\\|?*]/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 120);
  if (!cleaned || cleaned === '.' || cleaned === '..') return '';
  return cleaned;
}

async function handlePushFile(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  const query = routeQuery(req);
  const serial = await resolveSerial(query.get('serial') || undefined);
  const name = sanitizeUploadName(query.get('name') || '');
  if (!name) {
    sendJson(res, 400, { error: '文件名无效' });
    return;
  }
  const declared = Number(req.headers['content-length'] || 0);
  if (Number.isFinite(declared) && declared > MAX_UPLOAD_BYTES) {
    sendJson(res, 413, { error: '文件超过 2 GB' });
    return;
  }

  const temp = path.join(UPLOAD_DIR, `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  let size = 0;
  try {
    await fsp.mkdir(UPLOAD_DIR, { recursive: true });
    const limiter = new Transform({
      transform(chunk, encoding, callback) {
        size += chunk.length;
        if (size > MAX_UPLOAD_BYTES) {
          callback(new Error('文件超过 2 GB'));
          return;
        }
        callback(null, chunk);
      },
    });
    await pipeline(req, limiter, fs.createWriteStream(temp));

    await runAdb(['-s', serial, 'shell', 'mkdir', '-p', REMOTE_UPLOAD_DIR], { timeout: 8000 });
    const remote = `${REMOTE_UPLOAD_DIR}/${name}`;
    await runAdb(['-s', serial, 'push', temp, remote], {
      timeout: 600000,
      maxBuffer: 4 * 1024 * 1024,
    });
    sendJson(res, 200, { success: true, serial, name, path: remote, bytes: size });
  } catch (error) {
    if (!res.headersSent) sendJson(res, 500, { error: adbErrorHint(error) });
  } finally {
    await fsp.rm(temp, { force: true }).catch(() => {});
  }
}

async function handleDevices(req, res) {
  const adb = await adbStatus();
  if (!adb.available) {
    sendJson(res, 200, { adb, devices: [] });
    return;
  }
  try {
    const devices = await listDevices();
    sendJson(res, 200, { adb, devices });
  } catch (error) {
    sendJson(res, 200, { adb: { ...adb, available: false, error: adbErrorHint(error) }, devices: [] });
  }
}

async function handleAction(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  const body = await readJson(req);
  const serial = await resolveSerial(body.serial);
  const result = await executeAction(serial, body.action || {});
  sendJson(res, 200, { success: true, ...result, serial });
}

async function handleScreenshot(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  const body = await readJson(req);
  const serial = await resolveSerial(body.serial);
  const shot = await captureShot(serial);
  await pruneShots(serial);
  sendJson(res, 200, { success: true, serial, shot });
}

async function handleScreenshots(req, res) {
  const query = routeQuery(req);
  const serial = query.get('serial') || undefined;
  if (serial && !SERIAL_RE.test(serial)) {
    sendJson(res, 400, { error: '设备串号格式不正确' });
    return;
  }
  const items = await listShots(serial);
  sendJson(res, 200, { success: true, items, selected: state.selected });
}

async function handleSelectScreenshot(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  const body = await readJson(req);
  const shot = await selectShot(body.path);
  sendJson(res, 200, { success: true, shot });
}

async function handleFile(req, res) {
  const query = routeQuery(req);
  const requested = String(query.get('path') || '');
  const resolved = path.resolve(requested);
  if (!resolved.startsWith(SHOT_DIR + path.sep)) {
    sendJson(res, 403, { error: 'forbidden' });
    return;
  }
  let stat;
  try {
    stat = await fsp.stat(resolved);
  } catch {
    sendJson(res, 404, { error: 'not found' });
    return;
  }
  if (!stat.isFile()) {
    sendJson(res, 404, { error: 'not found' });
    return;
  }
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': stat.size,
    'Cache-Control': 'no-store',
  });
  const file = fs.createReadStream(resolved);
  res.on('close', () => file.destroy());
  file.pipe(res);
}

async function handleStream(req, res) {
  const query = routeQuery(req);
  const serial = String(query.get('serial') || '');
  if (!SERIAL_RE.test(serial)) {
    sendJson(res, 400, { error: '设备串号格式不正确' });
    return;
  }
  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Cache-Control': 'no-store, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();
  const client = streamClient(res);
  res.on('close', () => {
    client.closed = true;
    hub.unsubscribe(serial, client);
  });
  try {
    await hub.subscribe(serial, client);
  } catch {
    client.end();
  }
}

function registerTool(ctx) {
  ctx.tools.register({
    name: 'device_screenshot',
    description:
      'Capture the connected Android device screen and return it as an image. Without fresh=true, returns the screenshot currently selected in the device mirror, or the newest saved one. Use this to inspect the live device UI.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        serial: {
          type: 'string',
          description: 'Optional Android device serial. Defaults to the device selected in the mirror.',
        },
        fresh: {
          type: 'boolean',
          description: 'When true, capture the device screen now instead of using a saved screenshot.',
        },
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          path: { type: 'string' },
          serial: { type: 'string' },
          width: { type: 'integer' },
          height: { type: 'integer' },
          image: {
            type: 'object',
            additionalProperties: false,
            properties: {
              attachmentId: { type: 'string' },
              mediaType: { type: 'string' },
              bytes: { type: 'integer' },
              width: { type: 'integer' },
              height: { type: 'integer' },
              name: { type: 'string' },
            },
            required: ['attachmentId', 'mediaType', 'bytes', 'width', 'height'],
          },
        },
        required: ['path', 'serial', 'width', 'height'],
      },
      render: (_args, value) => {
        const blocks = [
          {
            type: 'text',
            text: `<path>${value.path}</path>\n<device>${value.serial}</device>\n<type>image</type>\n<content>\n${value.image?.mediaType || 'image'} image, ${value.width}x${value.height} px\n</content>`,
          },
        ];
        if (value.image) blocks.push({ type: 'image', attachment: value.image });
        return blocks;
      },
    },
    isConcurrencySafe: () => false,
    async execute(args) {
      const serial = await resolveSerial(args.serial);
      let shot = args.fresh ? null : await pickShot(serial);
      if (!shot) {
        shot = await captureShot(serial);
        await pruneShots(serial);
      }
      state.lastSerial = serial;
      saveState();
      const data = await fsp.readFile(shot.path);
      let image;
      try {
        const ref = await ctx.attachments.saveImage({ data, mediaType: 'image/png', name: shot.name });
        image = {
          attachmentId: ref.attachmentId,
          mediaType: ref.mediaType,
          bytes: ref.bytes,
          width: ref.width,
          height: ref.height,
          ...(ref.name === undefined ? {} : { name: ref.name }),
        };
      } catch {
        /* text-only fallback */
      }
      return {
        path: shot.path,
        serial,
        width: shot.width,
        height: shot.height,
        ...(image === undefined ? {} : { image }),
      };
    },
  });
}

export const name = 'device-deck';
export const inject = ['webServer'];

export function apply(ctx) {
  ensureDirs();

  const routes = [
    ['/api/device-deck/devices', handleDevices],
    ['/api/device-deck/inventory', handleInventory],
    ['/api/device-deck/emulator/start', handleEmulatorStart],
    ['/api/device-deck/emulator/stop', handleEmulatorStop],
    ['/api/device-deck/wifi/connect', handleWifiConnect],
    ['/api/device-deck/ios/boot', handleIosBoot],
    ['/api/device-deck/ios/shutdown', handleIosShutdown],
    ['/api/device-deck/ios/open', handleIosOpen],
    ['/api/device-deck/action', handleAction],
    ['/api/device-deck/screenshot', handleScreenshot],
    ['/api/device-deck/screenshots', handleScreenshots],
    ['/api/device-deck/screenshots/select', handleSelectScreenshot],
    ['/api/device-deck/file-push', handlePushFile],
    ['/api/device-deck/file', handleFile],
    ['/api/device-deck/stream', handleStream],
  ];

  for (const [route, handler] of routes) {
    ctx.effect(
      () =>
        ctx.webServer.register({
          kind: 'exact',
          path: route,
          handler: (req, res) => {
            Promise.resolve(handler(req, res)).catch((error) => {
              if (res.headersSent) {
                try {
                  res.end();
                } catch {
                  /* ignore */
                }
                return;
              }
              sendJson(res, 500, { error: adbErrorHint(error) });
            });
          },
        }),
      `device-deck route ${route}`,
    );
  }

  ctx.effect(() => () => hub.destroyAll(), 'device-deck stream teardown');

  ctx.inject(['tools', 'attachments'], (toolCtx) => {
    try {
      registerTool(toolCtx);
    } catch (error) {
      console.error('[device-deck] tool registration failed', error);
    }
  });
}
