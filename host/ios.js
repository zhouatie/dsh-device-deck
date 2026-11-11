import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileAsync } from './config.js';
import { readJson, sendJson } from './http.js';
import { iosMirrorStatus } from './ios-mirror.js';
import { isMacOS } from './util.js';

export async function listIosSimulators() {
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

const IOS_DEVICES_TTL_MS = 4000;

let iosDevicesCache = { at: 0, value: null };

export async function listIosDevices() {
  if (!isMacOS()) {
    return { available: false, message: 'iOS 真机仅支持 macOS。', items: [] };
  }
  if (iosDevicesCache.value && Date.now() - iosDevicesCache.at < IOS_DEVICES_TTL_MS) {
    return iosDevicesCache.value;
  }
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'device-deck-ios-'));
  const file = path.join(dir, 'devices.json');
  try {
    await execFileAsync('xcrun', ['devicectl', '--timeout', '5', 'list', 'devices', '--json-output', file], {
      timeout: 25_000,
      maxBuffer: 8 * 1024 * 1024,
    });
    const data = JSON.parse(await fsp.readFile(file, 'utf8'));
    const items = [];
    for (const device of data?.result?.devices || []) {
      const hardware = device.properties?.hardware || device.hardwareProperties || {};
      const connection = device.properties?.connection || device.connectionProperties || {};
      const software = device.properties?.software || {};
      const deviceState = device.properties?.state || device.deviceProperties || {};
      if (hardware.reality !== 'physical') continue;
      if (String(hardware.platform) !== 'iOS') continue;
      const udid = String(hardware.udid || '');
      if (!udid) continue;
      items.push({
        udid,
        name: String(deviceState.name || hardware.marketingName || udid),
        model: String(hardware.marketingName || ''),
        productType: String(hardware.productType || ''),
        osVersion: String(software.osVersionNumber?.stringValue || deviceState.osVersionNumber || ''),
        transport: connection.transportType === 'wired' ? 'USB' : '网络',
        pairing: String(connection.pairingState || ''),
        booted: deviceState.bootState === 'booted',
        developerMode: Boolean(deviceState.developerModeStatus?.enabled),
        mirroring: iosMirrorStatus(udid),
      });
    }
    items.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    const value = { available: true, items };
    iosDevicesCache = { at: Date.now(), value };
    return value;
  } catch (error) {
    const message = String(error?.stderr || error?.message || '读取 iOS 真机失败').trim();
    return { available: false, message, items: [] };
  } finally {
    await fsp.rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

function xcodeDeveloperDir() {
  try {
    return execFileSync('xcode-select', ['-p'], { encoding: 'utf8', timeout: 4000 }).trim();
  } catch {
    return '';
  }
}

function simulatorAppCandidates() {
  const candidates = [];
  const override = String(process.env.DSH_DEVICE_DECK_SIMULATOR_APP || '').trim();
  if (override) candidates.push({ path: override, label: 'Simulator' });
  const developer = xcodeDeveloperDir();
  if (developer) {
    candidates.push({ path: path.join(developer, 'Applications', 'Simulator.app'), label: 'Simulator' });
    candidates.push({ path: path.join(developer, '..', 'Applications', 'DeviceHub.app'), label: 'Device Hub' });
  }
  candidates.push({ path: '/Applications/Xcode.app/Contents/Developer/Applications/Simulator.app', label: 'Simulator' });
  return candidates;
}

async function openSimulatorApp() {
  if (!isMacOS()) throw new Error('iOS 模拟器仅支持 macOS。');
  const target = simulatorAppCandidates().find((item) => fs.existsSync(item.path));
  if (!target) {
    throw new Error('当前 Xcode 未提供 Simulator 应用。请从 Xcode 打开模拟器，或设置 DSH_DEVICE_DECK_SIMULATOR_APP 指向模拟器应用。');
  }
  await execFileAsync('open', ['-a', target.path], { timeout: 10_000 });
  return target.label;
}

export async function bootIosSimulator(udid) {
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
    await openSimulatorApp();
  } catch {
    /* the device can still boot headless */
  }
  return { success: true, message: '已启动 iOS 模拟器' };
}

export async function shutdownIosSimulator(udid) {
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

export async function openIosSimulator() {
  const label = await openSimulatorApp();
  return { success: true, message: `已打开 ${label}` };
}

export async function handleIosBoot(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  const body = await readJson(req);
  const result = await bootIosSimulator(body.udid);
  sendJson(res, 200, result);
}

export async function handleIosShutdown(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  const body = await readJson(req);
  const result = await shutdownIosSimulator(body.udid);
  sendJson(res, 200, result);
}

export async function handleIosOpen(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  await readJson(req);
  const result = await openIosSimulator();
  sendJson(res, 200, result);
}
