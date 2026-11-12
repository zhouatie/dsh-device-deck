import { runAdb } from './adb.js';
import { hub } from './stream.js';
import { reservePort } from './util.js';

export const RN_ACTIVITY_RE = /(^|[./])rn([./]|$)|rna|reactnative/i;

const RN_DEEP_LINK_MAX_AGE_SECONDS = 600;

function parseForegroundActivity(text) {
  const patterns = [
    /topResumedActivity=ActivityRecord\{[^}\n]*?\s([A-Za-z0-9_.]+)\/([A-Za-z0-9_.$]+)/,
    /mResumedActivity:\s*ActivityRecord\{[^}\n]*?\s([A-Za-z0-9_.]+)\/([A-Za-z0-9_.$]+)/,
    /mCurrentFocus=Window\{[^}\n]*?\s([A-Za-z0-9_.]+)\/([A-Za-z0-9_.$]+)/,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(String(text || ''));
    if (match) return { packageName: match[1], activity: match[2] };
  }
  return null;
}

export async function readForegroundActivity(serial) {
  try {
    const { stdout } = await runAdb(['-s', serial, 'shell', 'dumpsys', 'activity', 'activities'], { timeout: 6000 });
    const parsed = parseForegroundActivity(stdout);
    if (parsed) return parsed;
  } catch {
    /* fall back to the window dump */
  }
  try {
    const { stdout } = await runAdb(['-s', serial, 'shell', 'dumpsys', 'window', 'displays'], { timeout: 6000 });
    return parseForegroundActivity(stdout);
  } catch {
    return null;
  }
}

async function appPids(serial, packageName) {
  if (!packageName) return [];
  try {
    const { stdout } = await runAdb(['-s', serial, 'shell', 'pidof', packageName], { timeout: 4000 });
    return String(stdout)
      .trim()
      .split(/\s+/)
      .filter((pid) => /^\d+$/.test(pid));
  } catch {
    return [];
  }
}

function decodeDeepLink(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  try {
    return JSON.parse(`"${text}"`);
  } catch {
    return text
      .replace(/\\\//g, '/')
      .replace(/\\u([0-9a-f]{4})/gi, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
  }
}

function extractDeepLink(line) {
  const patterns = [/"deeplink_uri":"((?:[^"\\]|\\.)+)"/, /deeplink_uri=([^,\s]+)/];
  for (const pattern of patterns) {
    const match = pattern.exec(String(line || ''));
    if (!match) continue;
    const value = decodeDeepLink(match[1]);
    if (value.length <= 4096 && /^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return value;
  }
  return '';
}

export async function readRnDeepLink(serial, packageName) {
  const pids = await appPids(serial, packageName);
  let now = 0;
  try {
    const { stdout } = await runAdb(['-s', serial, 'shell', 'date', '+%s'], { timeout: 4000 });
    now = Number(String(stdout).trim());
  } catch {
    now = 0;
  }
  const baseArgs = ['-s', serial, 'shell', 'logcat', '-d', '-v', 'epoch'];
  let stdout = '';
  try {
    const args = pids.length ? [...baseArgs, '--pid', pids[0]] : baseArgs;
    ({ stdout } = await runAdb(args, { timeout: 6000 }));
  } catch {
    try {
      ({ stdout } = await runAdb(baseArgs, { timeout: 6000 }));
    } catch {
      return '';
    }
  }
  const lines = String(stdout).split('\n');
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index];
    if (!line.includes('deeplink_uri')) continue;
    const epoch = Number(line.trim().split(/\s+/)[0]);
    if (now > 0 && Number.isFinite(epoch) && now - epoch > RN_DEEP_LINK_MAX_AGE_SECONDS) continue;
    const value = extractDeepLink(line);
    if (value) return value;
  }
  return '';
}

async function queryWebViewPages(serial, socket) {
  let port = 0;
  try {
    port = await reservePort();
    await runAdb(['-s', serial, 'forward', `tcp:${port}`, `localabstract:${socket}`], { timeout: 5000 });
    const response = await fetch(`http://127.0.0.1:${port}/json/list`, {
      signal: AbortSignal.timeout(2500),
      cache: 'no-store',
    });
    if (!response.ok) return '';
    const pages = await response.json();
    if (!Array.isArray(pages)) return '';
    for (let index = pages.length - 1; index >= 0; index -= 1) {
      const page = pages[index];
      const url = String(page?.url || '');
      if (page?.type === 'page' && /^https?:\/\//i.test(url)) return url;
    }
    return '';
  } catch {
    return '';
  } finally {
    if (port) {
      try {
        await runAdb(['-s', serial, 'forward', '--remove', `tcp:${port}`], { timeout: 4000 });
      } catch {
        /* ignore */
      }
    }
  }
}

export async function readWebViewUrl(serial, packageName) {
  const pids = await appPids(serial, packageName);
  if (!pids.length) return '';
  let sockets = [];
  try {
    const { stdout } = await runAdb(['-s', serial, 'shell', 'cat', '/proc/net/unix'], { timeout: 4000 });
    const table = String(stdout);
    sockets = pids.map((pid) => `webview_devtools_remote_${pid}`).filter((socket) => table.includes(socket));
  } catch {
    return '';
  }
  for (const socket of sockets) {
    const url = await queryWebViewPages(serial, socket);
    if (url) return url;
  }
  return '';
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

const ASCII_TEXT_RE = /^[\x20-\x7E]*$/;

async function sendText(serial, text) {
  if (ASCII_TEXT_RE.test(text)) {
    await runAdb(['-s', serial, 'shell', 'input', 'text', toAdbInputText(text)], { timeout: 8000 });
    return;
  }
  const controller = hub.sessions.get(serial)?.scrcpyClient?.controller;
  if (!controller) {
    throw new Error('文本含非 ASCII 字符，需要剪贴板粘贴。请先打开设备镜像，或在设备上用输入法输入。');
  }
  try {
    await controller.setClipboard({ sequence: 0n, paste: true, content: text });
  } catch (error) {
    throw new Error(`剪贴板粘贴失败：${error?.message || error}`);
  }
}

function quoteForDeviceShell(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

const serialChains = new Map();

function serializeAction(serial, task) {
  const previous = serialChains.get(serial) || Promise.resolve();
  const next = previous.then(task, task);
  serialChains.set(serial, next.catch(() => undefined));
  return next;
}

export async function executeAction(serial, action) {
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
      case 'scroll': {
        const size = await orientedSize(serial, action);
        const scrollX = Math.max(-256, Math.min(256, Number(action.scrollX) || 0));
        const scrollY = Math.max(-256, Math.min(256, Number(action.scrollY) || 0));
        if (!scrollX && !scrollY) return { success: true };
        const x = Math.round(clamp01(action.ratioX) * size.width);
        const y = Math.round(clamp01(action.ratioY) * size.height);
        const session = hub.sessions.get(serial);
        const controller = session?.scrcpyClient?.controller;
        if (controller) {
          const videoWidth = Number(session.metadata?.width) || size.width;
          const videoHeight = Number(session.metadata?.height) || size.height;
          await controller.injectScroll({
            pointerX: Math.round(clamp01(action.ratioX) * videoWidth),
            pointerY: Math.round(clamp01(action.ratioY) * videoHeight),
            videoWidth,
            videoHeight,
            scrollX,
            scrollY,
            buttons: 0,
          });
          return { success: true };
        }
        if (scrollY) {
          const half = Math.round(size.height * Math.min(0.4, 0.08 + (Math.abs(scrollY) / 512) * 0.2));
          const centerY = Math.min(Math.max(y, half), size.height - half);
          const sign = Math.sign(scrollY);
          await runAdb(
            [
              '-s', serial, 'shell', 'input', 'swipe',
              String(x), String(centerY + sign * half),
              String(x), String(centerY - sign * half),
              '220',
            ],
            { timeout: 6000 },
          );
        }
        return { success: true };
      }
      case 'key': {
        const keyMap = { back: 4, home: 3, recents: 187, power: 26, enter: 66, menu: 82, volumeup: 24, volumedown: 25 };
        const code = keyMap[String(action.key || '').toLowerCase()] || 4;
        await runAdb(['-s', serial, 'shell', 'input', 'keyevent', String(code)], { timeout: 5000 });
        return { success: true };
      }
      case 'text': {
        const text = String(action.text || '');
        if (!text) throw new Error('输入文本为空');
        await sendText(serial, text);
        return { success: true };
      }
      case 'openUrl': {
        const url = String(action.url || '').trim();
        if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) throw new Error('链接需要带协议，例如 https:// 或 app://');
        await runAdb(
          ['-s', serial, 'shell', `am start -a android.intent.action.VIEW -d ${quoteForDeviceShell(url)}`],
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
