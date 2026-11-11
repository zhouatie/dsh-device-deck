import { handleAction, handleClipboard, handleFile, handlePageAddress, handlePushFile, handleScreenshot, handleScreenshots, handleSelectScreenshot, handleStream } from './host/actions.js';
import { adbErrorHint } from './host/adb.js';
import { handleDevices, handleEmulatorStart, handleEmulatorStop, handleInventory, handleWifiConnect } from './host/devices.js';
import { sendJson } from './host/http.js';
import { handleIosBoot, handleIosOpen, handleIosShutdown } from './host/ios.js';
import {
  handleIosAction,
  handleIosMirrorStart,
  handleIosMirrorStatus,
  handleIosMirrorStop,
  handleIosMirrorStream,
  handleIosScreenshot,
  iosMirrors,
} from './host/ios-mirror.js';
import { ensureDirs } from './host/state.js';
import { hub } from './host/stream.js';
import { registerTool } from './host/tool.js';

export const name = 'device-deck';
export const inject = ['webServer'];

export function apply(ctx) {
  ensureDirs();

  const routes = [
    ['/api/device-deck/devices', handleDevices],
    ['/api/device-deck/inventory', handleInventory],
    ['/api/device-deck/emulator/start', handleEmulatorStart],
    ['/api/device-deck/emulator/stop', handleEmulatorStop],
    ['/api/device-deck/wifi/connect', handleWifiConnect],
    ['/api/device-deck/ios/boot', handleIosBoot],
    ['/api/device-deck/ios/shutdown', handleIosShutdown],
    ['/api/device-deck/ios/open', handleIosOpen],
    ['/api/device-deck/ios/mirror/start', handleIosMirrorStart],
    ['/api/device-deck/ios/mirror/stop', handleIosMirrorStop],
    ['/api/device-deck/ios/mirror/status', handleIosMirrorStatus],
    ['/api/device-deck/ios/stream', handleIosMirrorStream],
    ['/api/device-deck/ios/action', handleIosAction],
    ['/api/device-deck/ios/screenshot', handleIosScreenshot],
    ['/api/device-deck/page-address', handlePageAddress],
    ['/api/device-deck/clipboard', handleClipboard],
    ['/api/device-deck/action', handleAction],
    ['/api/device-deck/screenshot', handleScreenshot],
    ['/api/device-deck/screenshots', handleScreenshots],
    ['/api/device-deck/screenshots/select', handleSelectScreenshot],
    ['/api/device-deck/file-push', handlePushFile],
    ['/api/device-deck/file', handleFile],
    ['/api/device-deck/stream', handleStream],
  ];

  for (const [route, handler] of routes) {
    ctx.effect(
      () =>
        ctx.webServer.register({
          kind: 'exact',
          path: route,
          handler: (req, res) => {
            Promise.resolve(handler(req, res)).catch((error) => {
              if (res.headersSent) {
                try {
                  res.end();
                } catch {
                  /* ignore */
                }
                return;
              }
              sendJson(res, 500, { error: adbErrorHint(error) });
            });
          },
        }),
      `device-deck route ${route}`,
    );
  }

  ctx.effect(() => () => hub.destroyAll(), 'device-deck stream teardown');
  ctx.effect(() => () => {
    for (const mirror of iosMirrors.values()) void mirror.teardown();
  }, 'device-deck ios teardown');

  ctx.inject(['tools', 'attachments'], (toolCtx) => {
    try {
      registerTool(toolCtx);
    } catch (error) {
      console.error('[device-deck] tool registration failed', error);
    }
  });
}
