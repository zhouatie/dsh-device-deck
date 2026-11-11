import { execFile } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

export const execFileAsync = promisify(execFile);

const HOST_DIR = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(HOST_DIR, '..');

export const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
export const DATA_DIR = path.join(DSH_HOME, 'device-deck');
export const SHOT_DIR = path.join(DATA_DIR, 'screenshots');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
export const STATE_FILE = path.join(DATA_DIR, 'state.json');
export const SERVER_BIN = path.join(ROOT_DIR, 'bin', 'scrcpy-server');
export const REMOTE_SERVER = '/data/local/tmp/dsh-device-deck-scrcpy.jar';
export const REMOTE_UPLOAD_DIR = '/sdcard/Download';

export const MAX_SHOTS = 30;
export const IDLE_TEARDOWN_MS = 30_000;
export const MAX_SUBSCRIBER_BACKLOG = 1024 * 1024;
export const MAX_GOP_BYTES = 8 * 1024 * 1024;
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;

export const T_META = 1;
export const T_CONFIG = 2;
export const T_DATA = 3;
export const T_ERROR = 4;
export const T_END = 5;

export const SERIAL_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
