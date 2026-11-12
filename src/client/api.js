import { API } from './constants.js';

export async function apiJson(path, init) {
  const response = await fetch(`${API}${path}`, {
    cache: 'no-store',
    ...init,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);
  return data;
}

export function postJson(path, value) {
  return apiJson(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });
}

async function clipboardMatches(text) {
  if (!navigator.clipboard?.readText) return true;
  try {
    return (await navigator.clipboard.readText()) === text;
  } catch {
    return true;
  }
}

export async function copyText(value, deniedMessage) {
  const text = String(value || '');
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      if (await clipboardMatches(text)) return;
    } catch {
      /* fall back to the textarea path */
    }
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-1000px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!copied) throw new Error(deniedMessage || 'clipboard unavailable');
  if (!(await clipboardMatches(text))) throw new Error(deniedMessage || 'clipboard unavailable');
}

export function shotUrl(shotPath) {
  return `${API}/file?path=${encodeURIComponent(shotPath)}`;
}

export function deleteShotFile(shotPath) {
  return apiJson(`/screenshots?path=${encodeURIComponent(shotPath)}`, { method: 'DELETE' });
}

export function clearShotHistory() {
  return apiJson('/screenshots', { method: 'DELETE' });
}

export async function copyShotImage(shotPath) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    throw new Error('clipboard unavailable');
  }
  const response = await fetch(shotUrl(shotPath), { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  await navigator.clipboard.write([new ClipboardItem({ [blob.type || 'image/png']: blob })]);
}

export async function attachShot(ctx, sessionId, inputActions, shot, t) {
  const conversation = ctx.conversation || ctx.get?.('conversation');
  if (!conversation?.createDrafts) throw new Error(t.attachUnavailable);
  const binding = ctx.sessions?.binding?.(sessionId);
  if (!binding) throw new Error(t.attachUnavailable);
  let actions = inputActions;
  if (!actions?.addAttachments) {
    try {
      actions = conversation.input?.for?.(binding.ctx)?.actions;
    } catch {
      /* fall through to the unavailable error */
    }
  }
  if (!actions?.addAttachments) throw new Error(t.attachUnavailable);
  const response = await fetch(shotUrl(shot.path), { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  const file = new File([blob], shot.name || `device-shot-${Date.now()}.png`, { type: 'image/png' });
  const ordinary = binding.session.getSnapshot().subagent === null;
  const drafts = conversation.createDrafts(sessionId, [file], ordinary);
  if (!actions.addAttachments(drafts.map((draft) => draft.id))) {
    conversation.releaseDraftAttachments?.(drafts);
    throw new Error(t.attachUnavailable);
  }
  try {
    conversation.input?.for?.(binding.ctx)?.focus?.();
  } catch {
    /* focus is best-effort */
  }
}
