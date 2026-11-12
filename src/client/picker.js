import { Fragment, createElement as h, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { apiJson, attachShot, shotUrl } from './api.js';
import { useCopy } from './i18n.js';
import { Icon } from './ui.js';

const shotPicker = {
  sessionId: null,
  listeners: new Set(),
};

function notifyShotPicker() {
  for (const listener of shotPicker.listeners) listener();
}

export function openShotPicker(sessionId) {
  if (!sessionId) return;
  shotPicker.sessionId = sessionId;
  notifyShotPicker();
}

export function closeShotPicker(sessionId) {
  if (sessionId !== undefined && shotPicker.sessionId !== sessionId) return;
  shotPicker.sessionId = null;
  notifyShotPicker();
}

export function useShotPickerSession() {
  const [sessionId, setSessionId] = useState(shotPicker.sessionId);
  useEffect(() => {
    const sync = () => setSessionId(shotPicker.sessionId);
    shotPicker.listeners.add(sync);
    sync();
    return () => {
      shotPicker.listeners.delete(sync);
    };
  }, []);
  return sessionId;
}

function shotTimeText(at) {
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ShotPicker({ ctx, sessionId, inputActions, onClose }) {
  const t = useCopy(ctx);
  const [shots, setShots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    let alive = true;
    apiJson('/screenshots')
      .then((data) => {
        if (alive) setShots(Array.isArray(data.items) ? data.items : []);
      })
      .catch((loadError) => {
        if (alive) setError(t.pickerLoadFailed.replace('{error}', loadError.message));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [t]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const choose = async (shot) => {
    if (busy) return;
    setBusy(shot.path);
    setError('');
    try {
      await attachShot(ctx, sessionId, inputActions, shot, t);
      onClose();
    } catch (attachError) {
      setError(t.pickerAttachFailed.replace('{error}', attachError.message));
    } finally {
      setBusy('');
    }
  };

  return ReactDOM.createPortal(
    h('div', {
      className: 'dd-shot-mask',
      onMouseDown: (event) => {
        if (event.target === event.currentTarget) onClose();
      },
    },
      h('div', {
        className: 'dd-shot-panel',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': t.pickerTitle,
      },
        h('div', { className: 'dd-shot-head' },
          h('div', { className: 'dd-shot-titles' },
            h('strong', null, t.pickerTitle),
            h('span', null, t.pickerHint),
          ),
          h('button', {
            type: 'button',
            className: 'dd-shot-close',
            title: t.close,
            'aria-label': t.close,
            onClick: onClose,
          }, h(Icon, { name: 'close', size: 12 })),
        ),

        loading
          ? h('div', { className: 'dd-shot-state' }, h('span', { className: 'dd-spinner' }), t.pickerLoading)
          : error && shots.length === 0
            ? h('div', { className: 'dd-shot-state' }, error)
            : shots.length === 0
              ? h('div', { className: 'dd-shot-state' }, t.pickerEmpty)
              : h(Fragment, null,
                  error && h('div', { className: 'dd-shot-error' }, error),
                  h('div', { className: 'dd-shot-grid' },
                    shots.map((shot) => h('button', {
                      key: shot.path,
                      type: 'button',
                      className: 'dd-shot-item',
                      'data-busy': busy === shot.path ? 'true' : 'false',
                      disabled: Boolean(busy),
                      title: new Date(shot.at).toLocaleString(),
                      onClick: () => void choose(shot),
                    },
                      h('img', { src: shotUrl(shot.path), alt: shot.name, draggable: false }),
                      h('span', { className: 'dd-shot-time' }, busy === shot.path ? t.pickerBusy : shotTimeText(shot.at)),
                    )),
                  ),
                ),
      ),
    ),
    document.body,
  );
}
