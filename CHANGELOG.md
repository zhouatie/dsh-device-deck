# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Delete one screenshot from the screenshot picker, or clear all screenshots
  with a two-step confirmation.

### Changed

- Split the Client half into `src/client/*.js` and build it into
  `lib/client.js` with esbuild. Edit the source files, not the generated bundle.
- Split the Host half into `host/*.js`. `index.js` now only registers the
  plugin, routes, and lifecycle hooks.
- `pnpm check` rebuilds the Client bundle, checks its syntax, and loads every
  Host module.
- Restyle the text-input and open-link popovers with a solid light surface,
  an inset input field, and a translucent close-button hover.
- Send text containing non-ASCII characters (for example Chinese) by pasting
  through the scrcpy clipboard. ASCII text still uses `adb shell input text`.
  Clipboard paste requires an open device mirror.

## [0.5.0] - 2026-11-11

### Added

- Preview a screenshot in the device mirror from the screenshot history, for
  Android and iOS. The first screenshot is no longer selected by default.
- Copy the previewed screenshot to the clipboard as a PNG image.
- Close the preview with the X button in its top-right corner.

### Changed

- Rename the screenshot-history rail label to “Screenshot history”.

## [0.4.0] - 2026-11-11

### Added

- List connected iOS devices with `xcrun devicectl` and show them in the device
  menu next to simulators.
- Mirror iOS device screens with WebDriverAgent over MJPEG. The Host builds and
  launches WebDriverAgent on first use, forwards ports with `iproxy`, and relays
  the stream. Tap, swipe, text input, Home, and screenshots go through the
  WebDriverAgent HTTP API.
- Rebuild WebDriverAgent automatically when the provisioning profile expires,
  and report an untrusted developer certificate with a direct hint.
- Mirror iOS simulators through the same WebDriverAgent pipeline as devices.
  Simulator builds skip signing and serve MJPEG directly, without `iproxy`.
- Resolve the simulator app from `xcode-select -p` and fall back to Device Hub,
  because Xcode 27 no longer ships `Simulator.app`.
- Keep the iOS mirror session alive for 10 minutes after the panel closes, so
  reopening reuses the running WebDriverAgent instead of reinstalling it. A new
  rail action stops the session immediately.
- Add a **Recents** action to the mirror rail. It opens the Android overview
  screen, so background apps can be swiped away.
- Add **Device screenshot** to the composer's `+` menu. It opens a screenshot
  picker, and the chosen shot becomes a draft attachment in the composer.
- Add **Open link** and **Back** to the iOS mirror. Back runs a left-edge swipe
  through WebDriverAgent. Open link calls WebDriverAgent's `/url` endpoint and
  accepts URLs or app schemes.
- Scroll the Android and iOS mirrors with the mouse wheel. Wheel down moves the
  content down. Android scrolls through the scrcpy control channel; iOS scrolls
  with a WebDriverAgent drag.

### Removed

- Remove the mirror rail's send action. Screenshots no longer send directly to
  the chat.

### Fixed

- Switching Sessions no longer remounts the mirror. The panel now lives in the
  root-scoped `shell.overlay`, so the stream and canvas keep running.

## [0.3.0] - 2026-11-10

### Added

- Turn the physical display off automatically while the mirror is open, and
  restore it when the mirror closes.

## [0.2.0] - 2026-11-10

### Added

- Send a local file to `/sdcard/Download/` on the selected Android device from
  the left rail.
- Concise hover labels for every action in the mirror rail.

### Changed

- The screenshot-history action now uses the Images icon, matching openLoop.

### Fixed

- New mirror connections replay the complete GOP from the last keyframe instead
  of a bare keyframe, which caused ghosted or frozen frames.
- A client that falls behind now reconnects instead of silently dropping delta
  frames.
- A stream is not reused after its last client leaves; the next client starts
  from a fresh keyframe.

## [0.1.1] - 2026-11-09

### Changed

- Moved the mirror actions from the title bar to the left rail. The title bar
  now holds the device switcher, connection status, and drag handle.
- The screenshot strip expands the frame height instead of shrinking the
  viewport, so the mirrored screen keeps its size.
- Anchored the rail to the viewport, so it no longer moves when the screenshot
  strip opens.

## [0.1.0] - 2026-11-09

### Added

- Live Android mirror using scrcpy and WebCodecs.
- Device menu in the Session header with running devices, Android AVDs, and iOS
  simulators.
- Headless Android AVD launch, emulator stop, and wireless ADB pairing.
- iOS simulator list, boot, shutdown, and Simulator launch.
- Screenshot capture, screenshot history, and sending screenshots to the chat.
- `device_screenshot` agent tool with image output.
- `Ctrl+M` shortcut for the mirror.
- English and Chinese UI strings.

### Known limitations

- The mirror supports Android only.
- H.264 only.
- Text input over ADB accepts ASCII only.
- iOS simulators are listed and controlled but not mirrored.
- Web mirroring and AI E2E testing are planned.
