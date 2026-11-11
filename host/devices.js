import { adbErrorHint, adbStatus, listDevices } from './adb.js';
import { avdNameForSerial, connectWifiDevice, launchAvd, listAvds, runningEmulatorProcesses, stopEmulator } from './emulator.js';
import { readJson, sendJson } from './http.js';
import { listIosDevices, listIosSimulators } from './ios.js';

export async function handleInventory(req, res) {
  const [adbResult, devicesResult, avdsResult, runningResult, iosResult, iosDevicesResult] = await Promise.allSettled([
    adbStatus(),
    listDevices(),
    listAvds(),
    runningEmulatorProcesses(),
    listIosSimulators(),
    listIosDevices(),
  ]);
  const adb = adbResult.status === 'fulfilled' ? adbResult.value : { available: false, error: adbErrorHint(adbResult.reason) };
  const devices = devicesResult.status === 'fulfilled' ? devicesResult.value : [];
  const avds = avdsResult.status === 'fulfilled' ? avdsResult.value : { available: false, avds: [], message: adbErrorHint(avdsResult.reason) };
  const processes = runningResult.status === 'fulfilled' ? runningResult.value : [];
  const ios = iosResult.status === 'fulfilled' ? iosResult.value : { available: false, message: '读取 iOS 模拟器失败', running: [], pending: [] };
  ios.devices = iosDevicesResult.status === 'fulfilled'
    ? iosDevicesResult.value
    : { available: false, message: '读取 iOS 真机失败', items: [] };

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

export async function handleEmulatorStart(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  const body = await readJson(req);
  const result = await launchAvd(body.name);
  sendJson(res, 200, result);
}

export async function handleEmulatorStop(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  const body = await readJson(req);
  const result = await stopEmulator({ serial: body.serial, pid: body.pid });
  sendJson(res, 200, result);
}

export async function handleWifiConnect(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  const body = await readJson(req);
  const result = await connectWifiDevice(body.address);
  sendJson(res, 200, result);
}

export async function handleDevices(req, res) {
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
