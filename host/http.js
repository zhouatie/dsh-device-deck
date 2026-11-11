import path from 'node:path';

export async function readJson(req, limit = 1024 * 1024) {
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

export function sendJson(res, status, value) {
  const body = Buffer.from(JSON.stringify(value));
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

export function routePath(req) {
  return new URL(req.url || '/', 'http://127.0.0.1').pathname;
}

export function routeQuery(req) {
  return new URL(req.url || '/', 'http://127.0.0.1').searchParams;
}

export function sanitizeUploadName(value) {
  const base = path.basename(String(value || '').replace(/\\/g, '/')).trim();
  const cleaned = base
    .replace(/[\u0000-\u001f<>:"/\\|?*]/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 120);
  if (!cleaned || cleaned === '.' || cleaned === '..') return '';
  return cleaned;
}
