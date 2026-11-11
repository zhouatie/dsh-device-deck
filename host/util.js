import { createServer as createNetServer } from 'node:net';

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitFor(check, timeout, message, fatal) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      if (await check()) return true;
    } catch {
      /* keep polling until the deadline */
    }
    const fatalError = fatal?.();
    if (fatalError) throw fatalError;
    await delay(700);
  }
  throw new Error(message);
}

export function isMacOS() {
  return process.platform === 'darwin';
}

export function safeSerial(serial) {
  return String(serial).replace(/[^A-Za-z0-9._-]/g, '_');
}

export function reservePort() {
  return new Promise((resolve, reject) => {
    const server = createNetServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close(() => (port ? resolve(port) : reject(new Error('无法分配本地端口'))));
    });
  });
}
