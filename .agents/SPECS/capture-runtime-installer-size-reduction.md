# Capture Runtime Installer Size Reduction

## Purpose

Reduce the Windows 11 x64 Capture Workbench NSIS installer to the desktop host
plus a lightweight `capture-runtime-core`. WindowsML OCR and Whisper executable
workers, their models, and the app-managed Ollama runtime/model are installed
only after explicit requirement installation.

The existing authenticated loopback `/v1` API, `CaptureClient`,
`CaptureDocumentV1`, requirement IDs, local desktop library/history, isolated
app-managed Ollama behavior, job cancellation/rollback, renderer token
isolation, and DirectML-first fail-closed OCR policy are unchanged.

## Reconciled Existing Decisions

- This spec extends `standalone-desktop-product.md`: the Tauri host remains the
  public Windows 11 x64 product and the runtime remains a native sidecar.
- It preserves `gpu-ocr-directml.md`: if `DmlExecutionProvider` is registered,
  the OCR worker creates one DML-first session and fails closed on
  initialization/inference failure. CPU-only OCR is allowed only when DML is
  unavailable. Provenance remains `windowsml-dml` or `cpu`.
- It replaces the old meaning of an OCR `bundled` install strategy. The
  checksum-pinned descriptor remains runtime-owned, but code and model bytes
  are optional release artifacts and are not NSIS resources.
- It extends `release-publication-v1.md` only for the governed artifact set and
  draft verification. It does not restore the retired separate clean-install
  evidence workflow or protected release environment.
- Deterministic development/smoke remains a QA lane. Product staging uses the
  core release runtime and real optional-engine installation path.

## Non-goals

- No public `/v1` route, schema, requirement ID, `CaptureDocumentV1`, or
  `CaptureClient` change.
- No renderer-provided artifact URL, byte count, checksum, catalog, local path,
  bearer token, or worker command.
- No runtime `pip install`, `uv sync`, unpinned code execution, or dynamic
  Python-package installation.
- No OCR/Whisper worker or model in the initial NSIS installer.
- No automatic Ollama inclusion in the initial installer.
- No other platform than Windows 11 x64 in v1.

## Delivery Slices and Ownership

1. Establish a reproducible pre-change size/startup report.
2. Replace dynamic PyInstaller collection with reviewed fixed specs/hooks.
3. Add catalog, worker protocol/process/client, and safe installation seams.
4. Package Whisper independently and route audio extraction through it.
5. Package OCR independently and route image/scanned-PDF extraction through it.
6. Build a core-only runtime, release asset set, and NSIS stage.
7. Enforce boundary, consistency, and measured size budgets in Nx/CI.

Pure functions and frozen dataclasses own descriptor parsing, hashes, archive
validation, protocol validation, and activation-state transitions. Stateful
classes/protocols own downloads, worker processes, install locks, activation,
and shutdown. No general plugin framework is introduced.

## Runtime Core Boundary

The core contains FastAPI/Uvicorn, Pydantic contracts, authenticated job
lifecycle, `pypdf` embedded-text extraction, structuring providers, the
runtime-owned engine catalog, worker orchestration, and installation logic.

The core must not contain/import at runtime:

- PaddleOCR, PaddleX, OpenCV, ONNX Runtime, `pypdfium2`, or Pillow;
- faster-whisper, CTranslate2, PyAV, or Hugging Face Hub;
- worker/model archives;
- binaries for non-Windows or non-x64 platforms.

PDF pages with embedded text are handled entirely by core. A PDF containing
any page without embedded text is sent to the OCR worker, which owns PDF
rendering and OCR. Images are sent to OCR; audio is sent to Whisper.

## Catalog and Artifact Formats

The embedded UTF-8 JSON catalog is canonical JSON with sorted keys and a final
LF:

```json
{
  "catalogVersion": "1",
  "runtimeVersion": "0.3.4",
  "requirements": [
    {
      "requirementId": "windowsml-ocr",
      "artifacts": [
        {
          "role": "worker",
          "requirementId": "windowsml-ocr",
          "artifactVersion": "0.3.4",
          "workerProtocolVersion": "1",
          "platform": "windows",
          "arch": "x86_64",
          "fileName": "capture-engine-ocr-0.3.4-windows-x64.zip",
          "bytes": 1,
          "sha256": "<64 lowercase hex>",
          "extractedBytes": 1,
          "entryPoint": "capture-engine-ocr.exe",
          "filesManifestSha256": "<64 lowercase hex>",
          "url": "https://github.com/gx-capture/capture-workbench/releases/download/v0.3.4/..."
        }
      ]
    }
  ]
}
```

Each requirement has exactly a `worker` artifact and one or more pinned
`model` artifacts. `requirementId`, `artifactVersion`,
`workerProtocolVersion`, `platform`, `arch`, `fileName`, `bytes`, `sha256`,
`extractedBytes`, `entryPoint`, and `filesManifestSha256` are mandatory.
`role` is `worker` or `model`; `url` is absolute HTTPS with no credentials,
query, or fragment and is owned only by the embedded catalog.

Every ZIP contains `files-manifest.json`. Its canonical JSON shape is:

```json
{
  "manifestVersion": "1",
  "files": [{ "path": "capture-engine-ocr.exe", "bytes": 1, "sha256": "<64 lowercase hex>" }]
}
```

Paths use `/`, are relative, unique case-insensitively, and are sorted. The
descriptor hashes the exact manifest bytes. The manifest lists every extracted
regular file except `files-manifest.json`; no unlisted file is accepted.

## Installed State

Each requirement is owned below:

```text
<app-data>/engines/<requirement-id>/
├── active.json
├── versions/<artifact-version>/
└── .staging/<unique-install-id>/
```

`active.json` is canonical JSON:

```json
{
  "stateVersion": "1",
  "requirementId": "windowsml-ocr",
  "artifactVersion": "0.3.4",
  "workerProtocolVersion": "1",
  "entryPoint": "versions/0.3.4/worker/capture-engine-ocr.exe",
  "activatedArtifacts": [
    { "role": "worker", "sha256": "<hex>" },
    { "role": "model", "sha256": "<hex>" }
  ]
}
```

Activation uses same-volume temporary write, flush, and atomic replace.
Versions install side-by-side. The old `active.json` is retained until all new
artifacts verify and the new worker probes with its model. Failure or
cancellation removes only the new staging/version and leaves the prior active
version unchanged. One in-process and one filesystem lock serialize concurrent
installation for a requirement; a concurrent caller observes the winning
active state or fails with an explicit busy error.

Once installed, readiness/probe/extraction uses only local verified files and
works offline. Network is used only by an explicit installation job.

## Worker Protocol

Worker stdin/stdout use UTF-8 JSON Lines. stderr is diagnostic-only, capped,
and may not contain secrets. Each request/result is one JSON object with:

- `protocolVersion: "1"`;
- caller-generated `requestId` (1-64 ASCII alphanumeric/`._-`);
- `operation: "probe" | "run" | "cancel"`;
- operation-specific `payload`.

`probe` validates worker code and optional model directory. `run` accepts a
runtime-owned absolute source path, media type, bounded extraction options, and
model directory. `cancel` names the running request ID. Responses contain
`ok`, validated `result` or a bounded structured error, and provenance.

Input framing is capped at 64 KiB. Output framing is capped at 8 MiB. More than
one line, invalid UTF-8/JSON, an unknown field/operation, wrong request ID,
protocol mismatch, oversized output, invalid provenance, or a nonzero exit is
fail-closed. One worker process serves one run plus its cancel message and then
exits. Core never sends its API bearer token in worker argv, environment,
stdin, source file, or model path.

Default probe timeout is 30 seconds and run timeout is 15 minutes. On user
cancellation core writes a cancel frame, waits up to two seconds, then
terminates; after a further three seconds it kills. Runtime shutdown applies
the same bounded terminate/kill cleanup to all owned workers. No executable
name-wide process termination is permitted.

## Safe Download and ZIP Rules

Downloads stream to a unique `.staging` file with a byte ceiling. HTTP status,
`Content-Length` when present, exact descriptor bytes, and SHA-256 must match
before extraction.

ZIP validation precedes extraction and rejects:

- absolute, drive-qualified, rooted, UNC, empty, `.` or `..` paths;
- path traversal after normalization;
- symlink, reparse-point, junction, device, FIFO, or other non-regular entries;
- duplicate normalized paths and case-insensitive collisions;
- encrypted entries;
- more than 4,096 entries;
- any single file over 512 MiB;
- aggregate bytes above the descriptor `extractedBytes` or 2 GiB;
- compression ratio above 200:1 for non-empty files;
- missing, malformed, mismatched, or duplicate inner manifest entries;
- files absent from the inner manifest or manifest byte/hash mismatch.

Extraction opens destination files with exclusive creation beneath the
resolved staging root, streams with byte ceilings, hashes while writing, and
never follows an existing path.

## Engine Installation Flows

`windowsml-ocr`:

1. Download/verify/extract the OCR worker artifact.
2. Probe worker code.
3. Download/verify/extract the pinned WindowsML model artifact.
4. Probe worker + model + providers.
5. Atomically activate.

`whisper-primary` follows the same sequence with a separately packaged
faster-whisper worker and fixed-revision model artifact. No Hugging Face API is
called by runtime. The installed model is entirely described by the catalog.

Ollama stays app-managed/on-demand with its existing isolated profile and
runtime-owned lifecycle. It is not added to core/NSIS and its bearer/token
boundary is unchanged.

## Release and NSIS

Release build order is worker executables, files manifests/ZIPs, checksums,
engine catalog, core executable, schema/runtime manifest, core-only NSIS, then
size report. Release assets include:

- core runtime executable, checksum, runtime manifest, and schema;
- OCR ZIP and files manifest;
- Whisper ZIP and files manifest;
- engine catalog;
- NSIS installer;
- runtime size report plus PyInstaller inventory/xref/warnings.

The NSIS resource allowlist is exactly core executable, runtime manifest, and
schema. A scan fails if engine workers, model assets, Paddle/ONNX/PDFium/Pillow,
Whisper/CTranslate2/PyAV/Hugging Face, or Ollama payloads are present.

Publication keeps the candidate draft-only, uploads the exact candidate,
downloads every asset and re-verifies byte count/hash/manifest/catalog/package,
then publishes. Existing same-version assets with different bytes fail closed.
No external release is created by local implementation or verification.

## Size Baseline and Budgets

`scripts/report_bundle_size.py` emits canonical JSON containing tool/runtime
versions, executable and installer bytes, optional installed bytes, cold/warm
startup milliseconds, top PyInstaller files, and categorized core/PDF/OCR/
Whisper bytes. Unknown measurements are `null` with an explicit blocker; they
are never invented.

`size-baselines/windows-x64.json` records the actual pre-change artifacts.
`size-budgets/windows-x64.json` is created only from measured post-change
artifacts with explicit headroom. A missing measurement cannot pass a gate.

Measured Windows x64 evidence for this implementation:

| Artifact                |      Before |      After |                 Change |
| ----------------------- | ----------: | ---------: | ---------------------: |
| Runtime executable      | 206,652,755 | 21,567,461 |               -89.563% |
| NSIS installer          | 208,071,907 | 23,431,713 |               -88.739% |
| Installed core-only app | unavailable | 32,001,423 | no comparable baseline |

The selected onefile core remains smaller than the previously measured
42,197,350-byte onedir candidate. Final hardening-follow-up readiness samples
are 1,600.332 ms cold and 1,435.840 ms warm.
The executable and NSIS budgets add exactly 10% headroom to the measured after
values. The old startup and installed-size baseline remain explicit `null`
values; no historical value was inferred.

## CI and Nx Gates

Required targets:

- `build-core-executable`
- `build-ocr-worker`
- `build-whisper-worker`
- `generate-engine-catalog`
- `verify-core-boundary`
- `verify-worker-boundaries`
- `bundle-size-report`
- `size-regression-check`

CI uploads size JSON, inventory, xref, and warnings. It fails on measured
budget regression, forbidden package/platform content, or mismatch among ZIP
bytes, inner manifests, catalog, runtime manifest, release directory, and
staged NSIS resources.

## Test Plan

Unit tests cover descriptor/catalog/state validation, checksums, traversal,
UNC/absolute/symlink/collision/bomb/unlisted-file rejection, atomic activation,
rollback, concurrency, and offline readiness.

Worker tests use a deterministic executable/script to cover probe/run,
protocol mismatch, malformed/multiple/oversized output, timeout, cancellation,
shutdown cleanup, and absence of bearer-token material from environment/argv/
stdin.

Release tests cover core and worker dependency boundaries, exact ZIP/manifests,
catalog/release consistency, core-only staging, and size-report/budget logic.
Existing runtime API/schema/provenance, Tauri Rust, package QA, deterministic
desktop smoke, and full workspace gates remain the behavior-preservation floor.

Real OCR, Whisper, and Ollama smokes are mandatory for Definition of Done when
their local fixtures and prepared assets exist. Otherwise the TODO remains open
with the exact command and blocker; deterministic evidence is not described as
real-engine proof.

The current repository intentionally contains an incomplete development
catalog because the exact OCR/Whisper source, license, NOTICE, derived-pipeline,
and real-fixture records are not yet approved. Publication catalog generation
requires the canonical checked-in direct-model source lock to pass and fails
closed while that lock is blocked. Model ZIP inputs and
`CAPTURE_*_MODEL_ARCHIVE`/`CAPTURE_*_MODEL_MANIFEST` environment variables are
retired. This does not weaken deterministic/unit verification and leaves the
real-engine and publication acceptance items open until both the lock and an
authorized self-hosted Windows x64 DirectML runner are available.

## Hardening Follow-up

- The per-requirement `.install.lock` is a persistent inert file guarded by a
  non-blocking OS-owned exclusive lock. Process exit releases ownership; the
  file is never unlinked after unlock, avoiding stale-file deadlock and
  unlink-after-unlock races.
- Archive components reject Windows-illegal characters, control characters,
  trailing dots/spaces, and case-insensitive reserved device basenames,
  including names with extensions. `files-manifest.json` is capped at 1 MiB
  from its `ZipInfo.file_size` before it can be read.
- OCR install probes use the configured WindowsML DirectML device ID, defaulting
  to zero. Whisper probe payload and the public `/v1` API/schema are unchanged.

## Acceptance Criteria

- Initial NSIS contains only core runtime metadata/schema bytes and no optional
  engine/model/Ollama payload.
- Core has no OCR/Whisper heavy dependency and still extracts embedded PDF
  text and owns job lifecycle.
- OCR/Whisper install from runtime-owned pinned/checksummed catalog artifacts,
  activate atomically, rollback, and run offline after installation.
- API, schemas, `CaptureClient`, `CaptureDocumentV1`, requirement IDs,
  cancellation, renderer token isolation, local history, and structuring modes
  remain compatible.
- DirectML policy and provenance are unchanged and fail closed.
- A pre-existing unlocked install lock file permits installation, while a lock
  held by a separate process rejects concurrent installation.
- Windows-unsafe archive paths and an oversized inner files manifest are
  rejected before extraction or manifest allocation.
- A nonzero configured WindowsML device ID reaches the OCR model probe.
- Catalog/manifests/assets agree exactly and size/boundary gates pass.
- `corepack pnpm verify` passes.
