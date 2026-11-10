# Device Deck

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Device Deck is a DeepSeek Harness plugin for device work inside the Harness Web UI.

It starts with an Android device mirror, then grows into one control surface for
Android, iOS, and Web devices, with the agent able to inspect and drive them.

> Status: alpha (`0.3.0`). The Android mirror is usable. iOS and Web mirroring
> and AI E2E testing are on the roadmap.

## Features

### Available now

- **Device menu in the Session header.** One click lists running devices,
  stopped Android AVDs, and iOS simulators, and pairs wireless ADB devices.
- **Android mirror.** scrcpy video decoded with WebCodecs in the page.
- **Screen off.** The physical display turns off while the mirror is open and
  turns back on when the mirror closes.
- **Direct control.** Tap, swipe, back, home, text input, and open URL or deep
  link.
- **Android AVD management.** List AVDs, start them headless, stop them, and
  open the mirror once they are ready.
- **iOS simulator management.** List simulators, boot and shut down them, and
  open the Simulator app. Screen mirroring is not implemented yet.
- **Wireless ADB.** Connect a device with `host` or `host:port`.
- **File transfer.** Pick a file on the computer and push it to
  `/sdcard/Download/` on the selected device.
- **Screenshots.** Save the current screen, browse the latest shots, and send a
  shot to the current chat.
- **Agent tool.** `device_screenshot` returns the selected screenshot as an
  image.
- **Shortcut.** `Ctrl+M` opens or closes the mirror.

## Roadmap

- Web page preview and control.
- iOS simulator mirroring.
- AI E2E testing: plan, act, wait, and assert against a device or page.
- Test recording and replay.
- Multi-device decks.

Roadmap items are not implemented. Do not treat them as available features.

## Requirements

- DeepSeek Harness with plugin support.
- Node.js 20 or newer for the Host half.
- `adb` from Android platform-tools for Android devices.
- Android SDK `emulator` for AVD management.
- Xcode command-line tools for iOS simulators, on macOS.

The bundle ships `scrcpy-server` 3.3.3, so a separate scrcpy install is not
required.

## Install

1. Clone the repository:

   ```bash
   git clone https://github.com/zhouatie/dsh-device-deck.git
   cd dsh-device-deck
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Install this folder as a bundle in Harness. Use **Settings → Plugins**, or
   the plugin manager with the absolute path of this folder.

4. Refresh the Harness Web page once.

For a local-folder install, the bundle is linked. Keep the folder in place and
run `pnpm install` there after dependency changes.

## Usage

1. Open a Session.
2. Click the device icon in the Session header, at the top right.
3. Pick a running Android device to open its mirror, or start a stopped AVD.
4. In the mirror, use the left rail for back, home, text, links, screenshot, history, send, reconnect, and close. History and send appear once a screenshot exists.
5. Use the title bar for the device switcher, connection status, and drag handle.
6. Select a screenshot, then send it to the current chat.

To send a file, click the paperclip in the left rail and choose a file. The file
is pushed to `/sdcard/Download/<name>` on the selected device.

Wireless ADB:

```text
192.168.1.102:5555
```

A bare host is accepted; port `5555` is added automatically.

## How it works

- The Host half registers `/api/device-deck/*` routes and starts one scrcpy
  session per Android device.
- The Host opens the scrcpy control channel, turns the display power off after
  the stream starts, and restores it when the last mirror client leaves.
- Video packets travel over same-origin chunked HTTP and are decoded with
  WebCodecs.
- The Client half registers into the Session header and renders the device menu
  and the floating mirror.
- Screenshots live under `~/.dsh/device-deck/screenshots`. The newest 30 per
  device are kept; the selected screenshot is never removed.
- File uploads are written to a temporary folder under
  `~/.dsh/device-deck/uploads`, pushed with `adb push`, and deleted after the
  transfer.
- The plugin keeps no cloud service. Device commands go to local `adb` or
  `xcrun`. Screenshots go to the current chat only when you send them.

## Limitations

- The mirror is Android only.
- H.264 only. H.265 devices show an error.
- Text input uses `adb shell input text`, so it accepts ASCII only.
- One device is mirrored at a time.
- iOS simulators are listed and controlled, but not mirrored.
- Web devices are not supported yet.
- File transfer sends one file at a time, up to 2 GB, to `/sdcard/Download`.
- Screen-off uses the scrcpy control channel. Some OEM builds may ignore it.
  If the plugin process crashes while the screen is off, press the power
  button.

## Development

```bash
pnpm install
pnpm check
```

`pnpm check` parses both plugin halves with `node --check`.

Layout:

| Path | Purpose |
| --- | --- |
| `index.js` | Host plugin: routes, adb, scrcpy, screenshots, tool |
| `client.js` | Client plugin: header menu, mirror, WebCodecs |
| `bin/scrcpy-server` | Bundled scrcpy server 3.3.3 |
| `cordis.patch.yml` | Bundle patch |
| `locale/` | Plugin Manager titles and descriptions |

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

Plugin code: [MIT](LICENSE).

The bundled scrcpy server is Apache-2.0. See [LICENSE-scrcpy](LICENSE-scrcpy)
and [NOTICE](NOTICE).

## 中文文档

[README.zh-CN.md](README.zh-CN.md)
