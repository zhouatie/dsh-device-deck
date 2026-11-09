# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

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
