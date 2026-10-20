# Desktop Release Runbook

How Tag Check desktop releases are built and published. The workflow is
`.github/workflows/release.yaml`.

## Version Authority

The release version lives in five places, which must agree:

- `VERSION`
- `package.json`
- `apps/desktop-tauri/src-tauri/tauri.conf.json`
- `apps/desktop-tauri/src-tauri/Cargo.toml`
- the `desktop-tauri` entry in `apps/desktop-tauri/src-tauri/Cargo.lock`

To change the version, edit `VERSION` and run `pnpm run version:sync`. It
writes the highest stable version found in the first four files to all four,
so it never moves a version backwards. Update `Cargo.lock` by hand. Check with
`pnpm run version:check` and `pnpm run tauri:release describe`, which prints
the release tag (`v<VERSION>`).

## Triggers

- Every push to `main` that changes more than documentation runs the
  workflow. `docs/**`, `*.md`, `**/README.md`, `**/AGENTS.md`,
  `.github/**/*.md`, `apps/*/docs/**` and `LICENSE` are ignored.
- `workflow_dispatch` runs it by hand, with an optional `checkout_ref` (branch,
  tag or commit) to evaluate instead of `main`.

## Release Gate

`prepare-release` reads `VERSION` and decides whether to build:

- If a release for this version is already **published**, under `v<VERSION>`,
  `<VERSION>` or `v<VERSION>-preview`, the run stops: "… is already published
  for <VERSION>; bump VERSION to release again."
- Otherwise it creates or force-moves the tag `v<VERSION>` to the commit being
  released and builds. Prereleases of other versions, such as `v3.0.0-alpha`
  for 3.0.0, do not count.
- While the release is still a **draft**, it follows `main`: every code merge
  moves the tag, rebuilds the assets into the same draft and rewrites its
  notes. Publish the draft to stop this.

So bump `VERSION` (with `docs/releases/<VERSION>.md`) in the PR that starts a
release, and publish the draft under the tag `v<VERSION>`.

## Release Assets

Each release ships three assets plus `SHA256SUMS.txt`:

- Windows x64 NSIS installer: `tag-check-desktop-v<VERSION>-windows-x64-nsis.exe`
- macOS arm64 unsigned archive:
  `tag-check-desktop-v<VERSION>-macos-arm64-unsigned.tar.gz`
- Linux x64 AppImage: `tag-check-desktop-v<VERSION>-linux-x64-appimage.AppImage`

GitHub Actions artifact names are the same without the extension. The macOS
archive holds an unsigned `Tag Check Desktop.app`; testers may need to allow it
in System Settings or remove its quarantine flag.

## Workflow Shape

1. `prepare-release`: checks the release notes exist, runs the release gate
   and resolves the tag and checkout ref.
2. `build-desktop`: a three-OS matrix:
   - `windows-latest` for the Windows x64 NSIS installer
   - `macos-latest` for the unsigned Apple silicon archive
   - `ubuntu-latest` for the Linux x64 AppImage
3. `publish-release`: downloads the three validated artifacts, assembles the
   release payload, writes `SHA256SUMS.txt`, uploads everything to the draft
   with `softprops/action-gh-release@v2`, then writes the notes into the draft.
   That action looks releases up with `getReleaseByTag`, which skips drafts, so
   it never updates an existing draft's notes itself.

The publish job runs only after every matrix job succeeds.

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

If any OS job fails, the publish job does not run and the draft keeps its
previous assets. CI artifacts and logs remain available for debugging.

CI never packages the desktop app outside this workflow. After dependency,
Nx or build-tooling upgrades, run `pnpm run tauri:release:windows` locally
(about 10 minutes) before merging to `main`.

## Release Notes

Each release needs `docs/releases/<VERSION>.md`; `prepare-release` fails
without it. A merge that changes only documentation does not run the
workflow, so after editing only the notes, update the draft's text by hand
(`gh release edit v<VERSION> --notes-file docs/releases/<VERSION>.md`).
