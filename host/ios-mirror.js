import { execFileSync, spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { Readable } from 'node:stream';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DATA_DIR, SHOT_DIR } from './config.js';
import { readJson, routeQuery, sendJson } from './http.js';
import { pruneShots, readShotMeta } from './screenshots.js';
import { saveState, state } from './state.js';
import { isMacOS, reservePort, safeSerial, waitFor } from './util.js';

const IOS_WDA_DIR = path.join(DATA_DIR, 'wda');

const IOS_WDA_DEVICE_PORT = 8100;

const IOS_WDA_MJPEG_PORT = 9100;

const IOS_WDA_BOOT_TIMEOUT_MS = 180_000;

const IOS_WDA_BUILD_TIMEOUT_MS = 900_000;

const IOS_WDA_IDLE_MS = 600_000;

export const iosMirrors = new Map();

const requireFromHere = createRequire(import.meta.url);

function resolveWdaProject() {
  const override = String(process.env.DSH_DEVICE_DECK_WDA_PROJECT || '').trim();
  if (override) return override;
  try {
    return path.join(path.dirname(requireFromHere.resolve('appium-webdriveragent/package.json')), 'WebDriverAgent.xcodeproj');
  } catch {
    return '';
  }
}

function resolveWdaBundleId() {
  const override = String(process.env.DSH_DEVICE_DECK_WDA_BUNDLE_ID || '').trim();
  return override || 'com.dsh.devicedeck.wda';
}

function resolveIosTeam() {
  const override = String(process.env.DSH_DEVICE_DECK_IOS_TEAM || '').trim();
  if (override) return override;
  if (!isMacOS()) return '';
  try {
    const plist = path.join(os.tmpdir(), `device-deck-xcode-${process.pid}.plist`);
    execFileSync('defaults', ['export', 'com.apple.dt.Xcode', plist], { timeout: 5000 });
    const plistJson = execFileSync('plutil', ['-extract', 'IDEProvisioningTeams', 'json', '-o', '-', plist], {
      timeout: 5000,
      encoding: 'utf8',
    });
    fs.rmSync(plist, { force: true });
    const teams = JSON.parse(plistJson);
    const flat = Object.values(teams || {}).flat().filter((team) => team && team.teamID);
    const personal = flat.find((team) => team.isFreeProvisioningTeam);
    return personal?.teamID || flat[0]?.teamID || '';
  } catch (error) {
    console.warn('[device-deck] 无法读取 Xcode 签名团队', error?.message || error);
    return '';
  }
}

function resolveIproxy() {
  const override = String(process.env.DSH_DEVICE_DECK_IPROXY || '').trim();
  if (override) return override;
  for (const candidate of ['/opt/homebrew/bin/iproxy', '/usr/local/bin/iproxy', '/usr/bin/iproxy']) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return 'iproxy';
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: options.cwd, env: options.env || process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    const lines = [];
    const collect = (chunk) => {
      for (const raw of String(chunk).split('\n')) {
        const line = raw.trim();
        if (!line) continue;
        lines.push(line);
        if (lines.length > 240) lines.shift();
        options.onLine?.(line);
      }
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`${command} 超时。${lines.slice(-3).join(' ')}`));
    }, options.timeout ?? 60_000);
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve(lines);
        return;
      }
      const locked = lines.some((line) => /device is locked|Unlock .* to Continue/i.test(line));
      if (locked) {
        reject(new Error('iPhone 已锁屏。请解锁设备并保持亮屏，然后重试。'));
        return;
      }
      const errorLine = [...lines].reverse().find((line) => /error:/i.test(line));
      reject(new Error(`${command} 退出码 ${code}。${errorLine || lines.slice(-4).join(' ')}`));
    });
  });
}

async function findXctestrun(derived) {
  const products = path.join(derived, 'Build', 'Products');
  try {
    const names = await fsp.readdir(products);
    const file = names.find((name) => name.endsWith('.xctestrun'));
    return file ? path.join(products, file) : '';
  } catch {
    return '';
  }
}

class IosMirrorSession {
  constructor(udid, kind = 'device') {
    this.udid = udid;
    this.kind = kind === 'simulator' ? 'simulator' : 'device';
    this.status = 'idle';
    this.message = '';
    this.process = null;
    this.forward = null;
    this.mjpegForward = null;
    this.port = 0;
    this.mjpegPort = 0;
    this.sessionId = '';
    this.screen = { width: 390, height: 844 };
    this.xctestrun = '';
    this.output = [];
    this.starting = null;
    this.idleTimer = null;
    this.streams = 0;
    this.markerPath = '';
    this.resigned = false;
  }

  pushLog(line) {
    this.output.push(line);
    if (this.output.length > 240) this.output.shift();
  }

  touch() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      if (this.streams > 0) {
        this.touch();
        return;
      }
      if (this.status === 'ready') void this.stop();
    }, IOS_WDA_IDLE_MS);
    this.idleTimer.unref?.();
  }

  ensure() {
    if (this.status === 'ready') {
      this.touch();
      return Promise.resolve(this);
    }
    if (this.starting) return this.starting;
    this.starting = this.start()
      .catch((error) => {
        this.status = 'error';
        this.message = String(error?.message || error);
        throw error;
      })
      .finally(() => {
        this.starting = null;
      });
    return this.starting;
  }

  async start() {
    this.status = 'starting';
    this.message = '正在准备 WebDriverAgent…';
    const project = resolveWdaProject();
    if (!project) throw new Error('未找到 WebDriverAgent 工程。请安装 appium-webdriveragent，或设置 DSH_DEVICE_DECK_WDA_PROJECT。');
    if (!fs.existsSync(project)) throw new Error(`WebDriverAgent 工程不存在：${project}`);
    await fsp.mkdir(IOS_WDA_DIR, { recursive: true });
    try {
      await this.boot(project);
      this.status = 'ready';
      this.message = '';
      this.touch();
      return this;
    } catch (error) {
      await this.teardown();
      throw error;
    }
  }

  async boot(project) {
    this.xctestrun = await this.prepareBuild(project);
    const attempt = async () => {
      this.message = '正在启动 WebDriverAgent…';
      await this.launch();
      this.message = '正在建立会话…';
      await this.openSession();
    };
    try {
      await attempt();
    } catch (error) {
      if (this.resigned || !this.profileExpired()) throw error;
      this.resigned = true;
      this.message = '签名已过期，正在重新构建 WebDriverAgent…';
      await this.teardown();
      this.output = [];
      await fsp.rm(this.markerPath, { force: true }).catch(() => undefined);
      this.xctestrun = await this.prepareBuild(project);
      await attempt();
    }
  }

  profileExpired() {
    return this.output.some((line) => /has expired|profile.*expired|expired.*profile/i.test(line));
  }

  async prepareBuild(project) {
    const simulator = this.kind === 'simulator';
    const bundleId = resolveWdaBundleId();
    let team = '';
    if (!simulator) {
      team = resolveIosTeam();
      if (!team) throw new Error('未找到 iOS 签名团队。请在 Xcode 登录 Apple ID，或设置 DSH_DEVICE_DECK_IOS_TEAM。');
    }
    const derived = path.join(IOS_WDA_DIR, simulator ? 'DerivedData-sim' : 'DerivedData');
    const marker = path.join(IOS_WDA_DIR, simulator ? `build-sim-${bundleId}.json` : `build-${team}-${bundleId}.json`);
    this.markerPath = marker;
    const existing = await findXctestrun(derived);
    if (existing && fs.existsSync(marker)) return existing;
    const args = [
      'build-for-testing',
      '-project', project,
      '-scheme', 'WebDriverAgentRunner',
      '-destination', `id=${this.udid}`,
      '-derivedDataPath', derived,
      `PRODUCT_BUNDLE_IDENTIFIER=${bundleId}`,
    ];
    if (!simulator) {
      args.push('-allowProvisioningUpdates', `DEVELOPMENT_TEAM=${team}`, 'CODE_SIGN_STYLE=Automatic');
    }
    this.message = '正在构建 WebDriverAgent（首次约 2–5 分钟）…';
    await runCommand('xcodebuild', args, {
      cwd: path.dirname(project),
      timeout: IOS_WDA_BUILD_TIMEOUT_MS,
      onLine: (line) => this.pushLog(line),
    });
    const built = await findXctestrun(derived);
    if (!built) throw new Error('WebDriverAgent 构建结束，但未找到 xctestrun 产物。');
    await fsp.writeFile(marker, JSON.stringify({ at: Date.now(), team, project, bundleId, kind: this.kind }));
    return built;
  }

  async launch() {
    const simulator = this.kind === 'simulator';
    this.port = await reservePort();
    this.mjpegPort = await reservePort();
    if (simulator) {
      this.forward = null;
      this.mjpegForward = null;
    } else {
      const iproxy = resolveIproxy();
      if (iproxy.includes(path.sep) && !fs.existsSync(iproxy)) {
        throw new Error(`未找到 iproxy：${iproxy}。请安装 libimobiledevice。`);
      }
      this.forward = spawn(iproxy, [String(this.port), String(IOS_WDA_DEVICE_PORT), '-u', this.udid], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      this.mjpegForward = spawn(iproxy, [String(this.mjpegPort), String(IOS_WDA_MJPEG_PORT), '-u', this.udid], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      this.forward.on('error', () => undefined);
      this.mjpegForward.on('error', () => undefined);
    }
    const env = {
      ...process.env,
      TEST_RUNNER_USE_PORT: simulator ? String(this.port) : String(IOS_WDA_DEVICE_PORT),
      TEST_RUNNER_MJPEG_SERVER_PORT: simulator ? String(this.mjpegPort) : String(IOS_WDA_MJPEG_PORT),
    };
    this.process = spawn('xcodebuild', ['test-without-building', '-xctestrun', this.xctestrun, '-destination', `id=${this.udid}`], {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const collect = (chunk) => {
      for (const line of String(chunk).split('\n')) {
        const text = line.trim();
        if (text) this.pushLog(text);
      }
    };
    this.process.stdout.on('data', collect);
    this.process.stderr.on('data', collect);
    this.process.on('exit', () => {
      if (this.status === 'ready') {
        this.status = 'error';
        this.message = 'WebDriverAgent 已退出。';
      }
    });
    const lockedHint = () => (this.output.some((line) => /device is locked|Unlock .* to Continue/i.test(line))
      ? new Error('iPhone 已锁屏。请解锁设备并保持亮屏，然后重试。')
      : null);
    try {
      await waitFor(async () => {
        const data = await this.request('GET', '/status', null, 4000);
        return Boolean(data?.value?.ready);
      }, IOS_WDA_BOOT_TIMEOUT_MS, `WebDriverAgent 启动超时。${this.output.slice(-3).join(' ')}`, lockedHint);
    } catch (error) {
      if (/not been explicitly trusted/i.test(this.output.join('\n'))) {
        throw new Error('开发者证书未受信任。请到「设置 → 通用 → VPN 与设备管理」信任该证书。');
      }
      throw error;
    }
  }

  async openSession() {
    const payload = {
      capabilities: {
        alwaysMatch: {
          platformName: 'ios',
          'appium:automationName': 'XCUITest',
          'appium:udid': this.udid,
          'appium:noReset': true,
          'appium:newCommandTimeout': 900,
        },
      },
    };
    const data = await this.request('POST', '/session', payload, 120_000);
    this.sessionId = String(data?.value?.sessionId || data?.sessionId || '');
    if (!this.sessionId) throw new Error('WebDriverAgent 会话创建失败。');
    try {
      await this.request('POST', `/session/${this.sessionId}/appium/settings`, {
        settings: { mjpegServerFramerate: 24, mjpegServerScreenshotQuality: 60 },
      }, 15_000);
    } catch {
      /* the stream still works with default settings */
    }
    try {
      const data = await this.request('GET', `/session/${this.sessionId}/wda/screen`, null, 10_000);
      const width = Number(data?.value?.screenSize?.width);
      const height = Number(data?.value?.screenSize?.height);
      if (width > 0 && height > 0) this.screen = { width, height };
    } catch {
      /* fall back to the default point size */
    }
  }

  async request(method, route, body, timeout = 20_000) {
    const response = await fetch(`http://127.0.0.1:${this.port}${route}`, {
      method,
      headers: body === null ? undefined : { 'Content-Type': 'application/json' },
      body: body === null ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
      cache: 'no-store',
    });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!response.ok) throw new Error(data?.value?.message || `WebDriverAgent 返回 HTTP ${response.status}`);
    return data;
  }

  ratioPoint(ratioX, ratioY) {
    const clamp = (value) => Math.max(0, Math.min(1, Number(value) || 0));
    return {
      x: Math.round(clamp(ratioX) * this.screen.width),
      y: Math.round(clamp(ratioY) * this.screen.height),
    };
  }

  async perform(action) {
    if (this.status !== 'ready') await this.ensure();
    this.touch();
    const type = String(action?.type || '');
    const base = `/session/${this.sessionId}`;
    if (type === 'tap') {
      const point = this.ratioPoint(action.ratioX, action.ratioY);
      await this.request('POST', `${base}/wda/tap`, point, 20_000);
      return { success: true };
    }
    if (type === 'swipe') {
      const from = this.ratioPoint(action.ratioX, action.ratioY);
      const to = this.ratioPoint(action.ratioEndX, action.ratioEndY);
      await this.request('POST', `${base}/wda/dragfromtoforduration`, {
        fromX: from.x,
        fromY: from.y,
        toX: to.x,
        toY: to.y,
        duration: Math.max(0.1, Math.min(2, Number(action.duration || 300) / 1000)),
      }, 30_000);
      return { success: true };
    }
    if (type === 'scroll') {
      const scrollY = Math.max(-64, Math.min(64, Number(action.scrollY) || 0));
      if (!scrollY) return { success: true };
      const center = this.ratioPoint(action.ratioX, action.ratioY);
      const span = Math.round(this.screen.height * Math.min(0.45, 0.12 + Math.abs(scrollY) / 96));
      const half = Math.max(1, Math.round(span / 2));
      const centerY = Math.min(Math.max(center.y, half), Math.max(half, this.screen.height - half));
      const sign = Math.sign(scrollY);
      await this.request('POST', `${base}/wda/dragfromtoforduration`, {
        fromX: center.x,
        fromY: centerY - sign * half,
        toX: center.x,
        toY: centerY + sign * half,
        duration: 0.3,
      }, 20_000);
      return { success: true };
    }
    if (type === 'text') {
      const value = String(action.text || '');
      if (!value) return { success: true };
      await this.request('POST', `${base}/wda/keys`, { value: Array.from(value) }, 30_000);
      return { success: true };
    }
    if (type === 'home') {
      await this.request('POST', `${base}/wda/pressButton`, { name: 'home' }, 15_000);
      return { success: true };
    }
    if (type === 'back') {
      const fromY = Math.round(this.screen.height / 2);
      await this.request('POST', `${base}/wda/dragfromtoforduration`, {
        fromX: 1,
        fromY,
        toX: Math.round(this.screen.width * 0.6),
        toY: fromY,
        duration: 0.2,
      }, 20_000);
      return { success: true };
    }
    if (type === 'openUrl') {
      const url = String(action.url || '').trim();
      if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) throw new Error('链接需要带协议，例如 https:// 或 app://');
      await this.request('POST', `${base}/url`, { url }, 20_000);
      return { success: true };
    }
    if (type === 'screenshot') {
      return { success: true, shot: await this.capture() };
    }
    throw new Error(`iOS 不支持的动作：${type || 'unknown'}`);
  }

  async capture() {
    const data = await this.request('GET', `/session/${this.sessionId}/screenshot`, null, 20_000);
    const base64 = data?.value;
    if (typeof base64 !== 'string' || base64.length === 0) throw new Error('iOS 截图失败：未返回图像');
    const buffer = Buffer.from(base64, 'base64');
    const filePath = path.join(SHOT_DIR, `device-${safeSerial(this.udid)}-${Date.now()}.png`);
    await fsp.writeFile(filePath, buffer);
    state.selected = filePath;
    saveState();
    return readShotMeta(filePath);
  }

  async teardown() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    for (const child of [this.process, this.forward, this.mjpegForward]) {
      if (child && child.exitCode === null) {
        try {
          child.kill('SIGTERM');
        } catch {
          /* already gone */
        }
      }
    }
    this.process = null;
    this.forward = null;
    this.mjpegForward = null;
    this.sessionId = '';
  }

  async stop() {
    await this.teardown();
    this.status = 'idle';
    this.message = '';
    iosMirrors.delete(this.udid);
  }
}

function getIosMirror(udid, kind = 'device') {
  let mirror = iosMirrors.get(udid);
  if (!mirror) {
    mirror = new IosMirrorSession(udid, kind);
    iosMirrors.set(udid, mirror);
  }
  return mirror;
}

export function iosMirrorStatus(udid) {
  const mirror = iosMirrors.get(udid);
  if (!mirror) return { status: 'idle', message: '' };
  return { status: mirror.status, message: mirror.message };
}

function iosUdid(value) {
  const clean = String(value || '').trim();
  if (!/^[A-Za-z0-9-]{8,64}$/.test(clean)) throw new Error('iOS 设备 UDID 不正确');
  return clean;
}

export async function handleIosMirrorStart(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  const body = await readJson(req);
  const mirror = getIosMirror(iosUdid(body.udid), body.kind);
  await mirror.ensure();
  sendJson(res, 200, { success: true, status: mirror.status, kind: mirror.kind, screen: mirror.screen });
}

export async function handleIosMirrorStop(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  const body = await readJson(req);
  const udid = iosUdid(body.udid);
  const mirror = iosMirrors.get(udid);
  if (mirror) await mirror.stop();
  sendJson(res, 200, { success: true });
}

export async function handleIosMirrorStatus(req, res) {
  const query = routeQuery(req);
  const udid = iosUdid(query.get('udid'));
  const mirror = iosMirrors.get(udid);
  sendJson(res, 200, {
    success: true,
    status: mirror?.status || 'idle',
    message: mirror?.message || '',
    screen: mirror?.screen || null,
  });
}

export async function handleIosMirrorStream(req, res) {
  const query = routeQuery(req);
  const mirror = getIosMirror(iosUdid(query.get('udid')), String(query.get('kind') || 'device'));
  await mirror.ensure();
  const response = await fetch(`http://127.0.0.1:${mirror.mjpegPort}/`, { cache: 'no-store' });
  if (!response.ok || !response.body) throw new Error('读取 iOS 画面失败');
  res.writeHead(200, {
    'Content-Type': response.headers.get('content-type') || 'multipart/x-mixed-replace; boundary=--BoundaryString',
    'Cache-Control': 'no-store, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();
  mirror.streams += 1;
  const source = Readable.fromWeb(response.body);
  res.on('close', () => {
    source.destroy();
    mirror.streams = Math.max(0, mirror.streams - 1);
    mirror.touch();
  });
  source.on('error', () => {
    if (!res.writableEnded) res.end();
  });
  source.pipe(res);
  mirror.touch();
}

export async function handleIosAction(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  const body = await readJson(req);
  const mirror = getIosMirror(iosUdid(body.udid), body.kind);
  const result = await mirror.perform(body.action || {});
  sendJson(res, 200, { ...result, udid: mirror.udid });
}

export async function handleIosScreenshot(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  const body = await readJson(req);
  const mirror = getIosMirror(iosUdid(body.udid), body.kind);
  if (mirror.status !== 'ready') await mirror.ensure();
  const shot = await mirror.capture();
  await pruneShots(mirror.udid);
  sendJson(res, 200, { success: true, udid: mirror.udid, shot });
}
