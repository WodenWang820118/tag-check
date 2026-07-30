# Capture Runtime Installer Size Reduction Decisions

## Risk and Change Mode

- Risk: high. This crosses public-contract-adjacent extraction flow,
  subprocess ownership, filesystem/archive security, network downloads,
  packaging, NSIS staging, CI, and release assets.
- Change mode: staged delete + refactor + add. Delete heavy dependencies from
  core first, retain public contracts, add only concrete OCR/Whisper worker
  seams required by current requirements.

## Ownership

- Pure frozen dataclasses/functions own catalog/artifact/state/protocol parsing,
  validation, hashing, and state transitions.
- `WorkerProcess` owns subprocess creation, bounded framing, cancellation,
  timeout, terminate/kill, and the live-process registry.
- `WorkerClient` owns typed probe/run validation.
- `EngineInstallationManager` owns downloads, requirement locks, staging,
  extraction, probes, side-by-side versions, activation, and rollback.
- Runtime core owns the embedded catalog. Renderer and public API callers own
  no URL/checksum/path/process inputs.
- OCR and Whisper workers own their heavy imports and model-specific behavior.

## Delivery and Behavior Preservation

- Preserve `/v1`, schemas, requirement IDs, `CaptureClient`,
  `CaptureDocumentV1`, structuring modes, job lifecycle, Tauri token isolation,
  and deterministic/product lane separation.
- Keep embedded PDF text in core; delegate only missing-page PDF OCR, image
  OCR, and audio transcription.
- Keep Ollama lifecycle/install/profile behavior independent and on-demand.
- Use one process per worker request. This is simpler to cancel and clean up,
  prevents cross-job model state leakage, and avoids a speculative shared
  worker pool.

## Rejected Alternatives

- Keep monolithic PyInstaller and rely only on excludes: rejected because
  runtime imports and environment collection remain easy to regress.
- Runtime `pip`/`uv` installs: rejected as unpinned remote execution and
  incompatible with offline readiness.
- Renderer-provided artifact metadata: rejected because it moves trust and
  download policy across the native token/security boundary.
- In-place engine update: rejected because partial failure cannot preserve the
  last known-good engine.
- General extension/plugin API: rejected because only two fixed workers are in
  scope and a generic abstraction would be speculative.
- Long-lived multi-request workers: deferred until measured startup cost
  justifies the larger lifecycle/state surface.

## PyInstaller Shape

- Use fixed checked-in specs and reviewed hooks.
- Choose `onefile` for the shipped core. The initial layout comparison measured
  21,584,889 bytes as onefile and 42,197,350 bytes as onedir, making onefile
  48.849% smaller. The final hardening-follow-up onefile is 21,567,461 bytes;
  onedir was not rebenchmarked because the selected release layout did not
  change. Onefile preserves the exact Tauri sidecar allowlist and has successful
  authenticated readiness samples.
- Worker ZIPs may use onedir because their extracted layout is already
  versioned and checksum-manifested.

## Measured Windows x64 Result

- Pre-change core: 206,652,755 bytes.
- Post-change core: 21,567,461 bytes (89.563% reduction).
- Pre-change NSIS: 208,071,907 bytes.
- Post-change core-only NSIS: 23,431,713 bytes (88.739% reduction).
- Scoped installed core-only NSIS footprint: 32,001,423 bytes. Silent native
  uninstall removed the exact install directory and uninstall key; the NSIS
  product-state key was retained by design, then ownership-checked and removed
  by the smoke for workspace hygiene.
- Final recorded readiness samples: 1,600.332 ms cold and 1,435.840 ms warm.
  The pre-change startup sample remains unavailable because the original
  reporter used a wrong readiness route; it is not reconstructed.
- Budgets are the measured core/NSIS bytes plus exactly 10% headroom:
  23,724,208 and 25,774,885 bytes.

## Rollback and Publication

- Active engine state changes only after artifact verification and successful
  probe. Failure/cancellation deletes staging/new version and retains the prior
  `active.json`.
- Keep `.install.lock` as a persistent file and acquire an OS-owned exclusive
  lock on it. Do not encode stale-PID takeover policy and do not unlink after
  unlock; process termination releases the lock without an unlink race.
- Treat ZIP paths as Windows deployment paths on every platform. Reject unsafe
  components before extraction and bound the inner files manifest to 1 MiB
  using ZIP metadata before reading it.
- Carry the configured WindowsML device ID only through the internal OCR probe
  option. Default to device zero and leave Whisper and `/v1` contracts
  unchanged.
- A release candidate is draft-only until exact uploaded assets are
  re-downloaded and verified. Local implementation does not publish or mutate
  external services.
- Publication is currently blocked, by design, until exact pinned OCR and
  Whisper model ZIPs/files manifests are supplied. An incomplete catalog fails
  before a release candidate can be assembled.

## Review Checkpoint

- Refactor goal: remove heavy engine code/assets from initial installation
  without observable contract or provider-policy regression.
- SOLID lens: keep existing runtime/API owners; introduce narrow protocols only
  at worker process/download seams; do not abstract unrelated installers.
- FP/OOP choice: functional validation/state transitions, stateful lifecycle
  owners.
- Behavior checks: existing API/schema tests, deterministic worker tests,
  security archive tests, core/worker scans, release consistency, desktop Rust
  gates, and real-engine smokes when fixtures/assets are locally available.
- Decision: proceed in coherent slices; leave Definition-of-Done items open
  when real or publication evidence cannot be produced locally.

## Verification Result

- Runtime lint, mypy (46 source files), pytest (112 tests), wheel, and sdist
  pass.
- OCR and Whisper worker builds pass after the DirectML ownership gate;
  boundary scans and brief/recursive inventories pass.
- Package QA passes 47 tests with one Windows symlink-capability skip; Rust
  fmt/check and 34 tests pass.
- Core boundary, worker boundary, core-only NSIS build, installed-size
  cleanup, size report, and budget gates pass.
- `corepack pnpm verify` passes, including clean consumers, deterministic
  sidecar smoke, and three Playwright tests.
- Focused hardening verification passes 40 lock/archive/worker tests. It proves
  a separate-process exclusive lock and crash release, Windows-unsafe ZIP
  rejection, the 1 MiB pre-read manifest bound, `deviceId=7` propagation to
  OCR model probing, and an unchanged Whisper probe payload.
- Release/catalog focused tests pass, publisher tests pass 10 with one
  Windows symlink-capability skip, and production catalog/release construction
  remains fail-closed for the intentionally absent OCR/Whisper model assets.
