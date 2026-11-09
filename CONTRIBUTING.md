# Contributing

Thanks for taking a look at Device Deck.

## Development

```bash
pnpm install
pnpm check
```

`pnpm check` runs `node --check` on both halves of the plugin.

To try the plugin in DeepSeek Harness, install this folder as a local bundle
through the plugin manager, then refresh the Web page.

## Pull requests

- Keep changes focused. One feature or fix per pull request.
- Match the existing code style: 2-space indentation, single quotes, no
  semicolon-free lines.
- Update `README.md`, `README.zh-CN.md`, and `CHANGELOG.md` when behavior or
  configuration changes.
- Do not commit `node_modules`, generated screenshots, or local profile data.
- State which platform you tested: Android, iOS simulator, or both.

## Reporting issues

Include:

- Harness version and operating system.
- `adb version` and `adb devices -l` output.
- Whether the device is a real device, an Android AVD, or an iOS simulator.
- The exact error text and, when relevant, a screenshot.

Do not include tokens, private host names, or personal data.

## License

By contributing, you agree that your contribution is licensed under the MIT
License.
