import fs from 'node:fs';
import { DATA_DIR, SHOT_DIR, STATE_FILE, UPLOAD_DIR } from './config.js';

export const state = {
  selected: null,
  lastSerial: null,
};

export function ensureDirs() {
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

export function saveState() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = `${STATE_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
    fs.renameSync(tmp, STATE_FILE);
  } catch {
    /* state is best effort */
  }
}
