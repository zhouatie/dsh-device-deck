# Contributing

Thanks for taking a look at Device Deck.

## Development

```bash
pnpm install
pnpm build
pnpm check
```

The Client half lives in `src/client/` and is bundled into `lib/client.js` by
esbuild. Edit the source files, not the generated bundle. Run `pnpm build` and
commit the rebuilt `lib/client.js` and `lib/client.js.map` with your changes.

The Host half is split across `host/*.js`; `index.js` only wires routes and
lifecycle. `pnpm check` rebuilds the Client bundle, checks its syntax, and loads
every Host module.

To try the plugin in DeepSeek Harness, install this folder as a local bundle
through the plugin manager, then refresh the Web page.

## Pull requests

- Keep changes focused. One feature or fix per pull request.
- Match the existing code style: 2-space indentation, single quotes, no
  semicolon-free lines.
- Update `README.md`, `README.zh-CN.md`, and `CHANGELOG.md` when behavior or
  configuration changes.
- Do not commit `node_modules`, generated screenshots, or local profile data.
  Do commit the generated `lib/client.js` and `lib/client.js.map`.
- State which platform you tested: Android, iOS simulator, or both.

## Releases

See [RELEASING.md](RELEASING.md) for the npm release flow.

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
