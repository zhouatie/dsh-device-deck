# Releasing

Device Deck publishes to npm from GitHub Actions with
[npm trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC).
No npm token is stored in the repository or in GitHub secrets.

## Prerequisites

- The npm package `dsh-device-deck` exists.
- The package has a GitHub Actions trusted publisher:
  - Organization or user: `zhouatie`
  - Repository: `dsh-device-deck`
  - Workflow filename: `publish.yml`
  - Permission: `npm publish`
- The npm account has 2FA enabled.
- `main` is clean and `pnpm check` passes.

The trusted publisher status is shown at
`https://www.npmjs.com/package/dsh-device-deck/access`. A new connection starts
as **Pending validation** and becomes **Valid** after one successful publish.

## Versioning

Use SemVer. `npm version <patch|minor|major>` updates `package.json`, creates a
release commit, and creates a `v<version>` tag.

Do not reuse or force-push a release tag. A published version cannot be
republished; bump the version instead.

## Release

1. Update `CHANGELOG.md`.
2. Run the syntax check:

   ```bash
   pnpm check
   ```

3. Bump the version and create the tag:

   ```bash
   npm version patch -m "chore: release %s"
   ```

4. Push the commit and the tag:

   ```bash
   git push origin main
   git push origin "v$(node -p "require('./package.json').version")"
   ```

5. The `publish` workflow runs on the tag. It uses OIDC and runs:

   ```text
   npm publish --provenance --access public
   ```

6. Watch the run:

   ```bash
   gh run list --workflow publish.yml --limit 1
   gh run watch <run-id> --exit-status
   ```

7. Wait for the registry. A new version can return 404 or show a
   `0.0.0-stage` placeholder for one or two minutes.

8. Verify the release:

   ```bash
   npm view dsh-device-deck version
   npm view dsh-device-deck@<version> dist.attestations
   ```

   The npm version page should show a provenance badge.

9. Update the market index:
   - `market/index.json`: `versions[0].version`, `publishTimestamp`, and
     `engines.dsh` when the supported range changes.
   - `market/README.md`: the current version and the install command.
   - Get the publish time from `npm view dsh-device-deck time --json` and
     convert it to Unix seconds.
   - Commit and push.

10. Verify the live index:

    ```bash
    curl -s https://raw.githubusercontent.com/zhouatie/dsh-device-deck/main/market/index.json
    ```

## Failure handling

| Failure | Action |
|---|---|
| Tag does not match `package.json` | The workflow fails before publishing. Fix the tag; bump the version if it was already consumed. |
| Trusted publisher is pending | Publish once before the deadline shown on the package settings page. |
| npm returns 404 for a new version | Wait one or two minutes, then retry the check. |
| npm rejects the version as already published | Bump the patch version and create a new tag. |
| OIDC or workflow fails | Read the workflow log. Fix the workflow or trusted publisher fields, then bump and retry. |

Do not fall back to `npm publish` with a bypass-2FA token. That path is being
restricted and is not the normal release flow. If OIDC is unavailable, use a
short-lived granular token only for recovery, then revoke it.
