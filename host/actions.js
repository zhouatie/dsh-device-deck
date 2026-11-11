import { spawn } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { RN_ACTIVITY_RE, executeAction, readForegroundActivity, readRnDeepLink, readWebViewUrl } from './android.js';
import { adbErrorHint, resolveSerial, runAdb } from './adb.js';
import { MAX_UPLOAD_BYTES, REMOTE_UPLOAD_DIR, SERIAL_RE, SHOT_DIR, UPLOAD_DIR } from './config.js';
import { readJson, routeQuery, sanitizeUploadName, sendJson } from './http.js';
import { captureShot, listShots, pruneShots, selectShot } from './screenshots.js';
import { state } from './state.js';
import { hub, streamClient } from './stream.js';

export async function handlePushFile(req, res) {
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

function clipboardCandidates() {
  if (process.platform === 'darwin') return [['/usr/bin/pbcopy', []], ['pbcopy', []]];
  if (process.platform === 'win32') return [['clip', []]];
  if (process.platform === 'linux') {
    return [
      ['wl-copy', []],
      ['xclip', ['-selection', 'clipboard']],
      ['xsel', ['--clipboard', '--input']],
    ];
  }
  return [];
}

async function writeClipboard(text) {
  const candidates = clipboardCandidates();
  if (!candidates.length) throw new Error('当前系统不支持写入剪贴板');
  let lastError;
  for (const [command, args] of candidates) {
    try {
      await new Promise((resolve, reject) => {
        const child = spawn(command, args, { stdio: ['pipe', 'ignore', 'ignore'] });
        const timer = setTimeout(() => {
          child.kill('SIGKILL');
          reject(new Error(`${command} 超时`));
        }, 4000);
        child.once('error', (error) => {
          clearTimeout(timer);
          reject(error);
        });
        child.once('close', (code) => {
          clearTimeout(timer);
          if (code === 0) resolve();
          else reject(new Error(`${command} 退出码 ${code}`));
        });
        child.stdin.on('error', () => {});
        child.stdin.end(text);
      });
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`无法写入系统剪贴板：${lastError?.message || '未知错误'}`);
}

export async function handleClipboard(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  const body = await readJson(req);
  const text = String(body?.text || '');
  if (!text.trim()) {
    sendJson(res, 400, { error: '复制内容为空' });
    return;
  }
  if (text.length > 8192) {
    sendJson(res, 400, { error: '复制内容过长' });
    return;
  }
  await writeClipboard(text);
  sendJson(res, 200, { success: true });
}

export async function handlePageAddress(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  const query = routeQuery(req);
  const serial = await resolveSerial(query.get('serial') || undefined);
  const foreground = await readForegroundActivity(serial);
  if (!foreground) {
    sendJson(res, 404, { error: '未读取到前台页面。请保持设备亮屏并解锁。' });
    return;
  }
  let kind = 'activity';
  let address = `${foreground.packageName}/${foreground.activity}`;
  if (RN_ACTIVITY_RE.test(foreground.activity)) {
    const deepLink = await readRnDeepLink(serial, foreground.packageName);
    if (deepLink) {
      kind = 'rn';
      address = deepLink;
    }
  }
  if (kind === 'activity') {
    const pageUrl = await readWebViewUrl(serial, foreground.packageName);
    if (pageUrl) {
      kind = 'h5';
      address = pageUrl;
    }
  }
  sendJson(res, 200, {
    success: true,
    serial,
    kind,
    address,
    package: foreground.packageName,
    activity: foreground.activity,
  });
}

export async function handleAction(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  const body = await readJson(req);
  const serial = await resolveSerial(body.serial);
  const result = await executeAction(serial, body.action || {});
  sendJson(res, 200, { success: true, ...result, serial });
}

export async function handleScreenshot(req, res) {
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

export async function handleScreenshots(req, res) {
  const query = routeQuery(req);
  const serial = query.get('serial') || undefined;
  if (serial && !SERIAL_RE.test(serial)) {
    sendJson(res, 400, { error: '设备串号格式不正确' });
    return;
  }
  const items = await listShots(serial);
  sendJson(res, 200, { success: true, items, selected: state.selected });
}

export async function handleSelectScreenshot(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  const body = await readJson(req);
  const shot = await selectShot(body.path);
  sendJson(res, 200, { success: true, shot });
}

export async function handleFile(req, res) {
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

export async function handleStream(req, res) {
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
