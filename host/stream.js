import fs from 'node:fs';
import { Adb, AdbServerClient } from '@yume-chan/adb';
import { AdbServerNodeTcpConnector } from '@yume-chan/adb-server-node-tcp';
import { AdbScrcpyClient, AdbScrcpyOptions3_3_3 } from '@yume-chan/adb-scrcpy';
import { AndroidScreenPowerMode } from '@yume-chan/scrcpy';
import { adbErrorHint, runAdb } from './adb.js';
import { IDLE_TEARDOWN_MS, MAX_GOP_BYTES, MAX_SUBSCRIBER_BACKLOG, REMOTE_SERVER, SERVER_BIN, T_CONFIG, T_DATA, T_END, T_ERROR, T_META } from './config.js';

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

export const hub = {
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

export function streamClient(res) {
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
