# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Add a **Recents** action to the mirror rail. It opens the Android overview
  screen, so background apps can be swiped away.
- Add **Device screenshot** to the composer's `+` menu. It opens a screenshot
  picker, and the chosen shot becomes a draft attachment in the composer.

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
