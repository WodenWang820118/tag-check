# Desktop Release Runbook

This runbook defines the official Tag Check desktop release flow for the first
cross-platform Tauri release, `2.0.0`, and the future stable releases that
follow the same contract.

## Version Authority

Every desktop release must keep these version authorities in sync:

- `package.json`
- `apps/desktop-tauri/src-tauri/tauri.conf.json`
- `apps/desktop-tauri/src-tauri/Cargo.toml`

The release helper fails when those files disagree or when the checked-out
version does not match the requested stable release tag.

## Supported Release Assets

`2.0.0` ships exactly these desktop assets:

- Windows x64 NSIS installer: `tag-check-desktop-v2.0.0-windows-x64-nsis.exe`
- macOS arm64 unsigned archive: `tag-check-desktop-v2.0.0-macos-arm64-unsigned.tar.gz`
- Linux x64 AppImage: `tag-check-desktop-v2.0.0-linux-x64-appimage.AppImage`

Canonical artifact names in GitHub Actions drop the file extension:

- `tag-check-desktop-v2.0.0-windows-x64-nsis`
- `tag-check-desktop-v2.0.0-macos-arm64-unsigned`
- `tag-check-desktop-v2.0.0-linux-x64-appimage`

The macOS asset is intentionally unsigned for `2.0.0`. Operators and testers
should expect manual trust prompts when opening it on a local machine.

## Triggers

The release workflow in `.github/workflows/release.yaml` supports two entry
paths:

- Push a stable semver tag such as `v2.0.0`.
- Run `workflow_dispatch` with both:
  - `release_tag`: a stable tag such as `v2.0.0`
  - `checkout_ref`: the branch, tag, or commit that should resolve to that tag

Both paths validate the requested tag format. Each build job and the publish job
also verify that the checked-out `HEAD` exactly matches the requested release
tag commit before bundling or publishing anything.

## Workflow Shape

The release workflow runs in three phases:

1. `prepare-release`: resolves the stable release tag and checkout ref.
2. `build-desktop`: runs a 3-OS matrix across:
   - `windows-latest` for the Windows x64 NSIS installer
   - `macos-latest` for the unsigned Apple Silicon macOS archive
   - `ubuntu-latest` for the Linux x64 AppImage
3. `publish-release`: downloads all three validated artifacts, assembles the
   release payload, writes `SHA256SUMS.txt`, and creates a draft GitHub Release.

The publish job runs only after every required matrix job succeeds.

## Validation Rules

Every matrix job must:

- install the shared frontend and backend dependencies
- run the platform-specific Nx bundle target
- validate that `dist/release-assets/<platform>/release-manifest.json` exists
- validate that the expected canonical asset file exists in the same directory

The publish job validates the assembled release a second time by:

- downloading every uploaded artifact
- re-reading each release manifest
- recomputing each asset checksum
- writing one `SHA256SUMS.txt` file that covers every release asset

## Failure Policy

If any required OS job fails, the draft release payload must not be published as
complete. CI artifacts and logs remain available for debugging, but the publish
job does not run.

## Release Notes

Each desktop release must provide a matching notes file under `docs/releases/`.
For example, `v2.0.0` publishes from `docs/releases/2.0.0.md`.

## Size Reporting

Existing Windows-focused size reporting stays informational for `2.0.0`. It
must not block the first cross-platform Tauri release while packaging and draft
release automation are being standardized.
