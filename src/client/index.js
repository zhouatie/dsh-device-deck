import { Fragment, createElement as h, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Panel } from './android.js';
import { currentCopy } from './i18n.js';
import { IosPanel } from './ios.js';
import { makeLauncher } from './launcher.js';
import { openShotPicker } from './picker.js';
import { setSharedOpen, shared, useSharedOpen, useSharedPlatform } from './store.js';
import { CSS } from './styles.js';
import { Icon } from './ui.js';

function makeMirrorHost(ctx) {
  return function DeviceMirrorHost() {
    const open = useSharedOpen();
    const platform = useSharedPlatform();

    useEffect(() => {
      const onKeyDown = (event) => {
        if (!event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
        if (event.repeat) return;
        if (String(event.key).toLowerCase() !== 'm') return;
        event.preventDefault();
        event.stopPropagation();
        setSharedOpen(!shared.open);
      };
      window.addEventListener('keydown', onKeyDown, true);
      return () => window.removeEventListener('keydown', onKeyDown, true);
    }, []);

    return h(Fragment, null,
      h('style', { 'data-dsh-device-deck': '' }, CSS),
      open
        ? ReactDOM.createPortal(
            platform === 'ios'
              ? h(IosPanel, {
                  ctx,
                  onClose: () => setSharedOpen(false),
                })
              : h(Panel, {
                  ctx,
                  onClose: () => setSharedOpen(false),
                }),
            document.body,
          )
        : null,
    );
  };
}

function ShotMenuIcon({ size = 14 }) {
  return h(Icon, { name: 'camera', size });
}

export default {
  inject: ['slots', 'sessions', 'locale', 'conversation'],
  apply(ctx) {
    const Launcher = makeLauncher(ctx);
    const MirrorHost = makeMirrorHost(ctx);
    ctx.slots.inject('shell.overlay', () =>
      ctx.slots.register({
        name: 'shell.overlay',
        id: 'device-deck-mirror',
        order: 20,
      }, MirrorHost),
    );
    ctx.slots.inject('conversation.session.header.utilities', () =>
      ctx.slots.register({
        name: 'conversation.session.header.utilities',
        id: 'device-deck',
        order: 10,
      }, Launcher),
    );
    ctx.inject(['commandUi'], (scope) => {
      const commands = scope.get('commandUi');
      scope.effect(() => commands.register({
        name: 'device-shot',
        label: () => currentCopy(ctx).menuShot,
        description: () => currentCopy(ctx).menuShotHint,
        icon: ShotMenuIcon,
        available: (session) => Boolean(session?.sessionId && ctx.sessions?.binding?.(session.sessionId)),
        ui: {
          kind: 'action',
          run: (session) => {
            openShotPicker(session.sessionId);
          },
        },
      }), 'device-deck: screenshot command');
    });
  },
};
