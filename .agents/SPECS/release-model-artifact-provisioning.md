# Tiered Release and Direct Model Delivery Specification

## Purpose

Publish Capture Workbench `0.3.4` safely in one of two canonical modes:
core-only while model provenance is unresolved, or model-enabled after every
existing direct-model trust gate passes. Keep the installer small and preserve
explicit-consent, checksum-pinned model installation when models are enabled.

## Non-Goals

- No model ZIP build, GitHub Release model asset, Actions model handoff, runtime
  cache lookup, sibling-repository input, secret, or mutable upstream ref.
- No worker archive format change.
- No implicit/background install, consent change, new API endpoint, token
  persistence, package API change, or `cert-prep` operation.
- No tag, release, package mutation, or publication from the candidate
  workflow.
- No second release workflow, caller-selected release mode, bypass flag, or
  best-effort fallback from malformed model metadata to core-only.

## Release Mode Contract

The checked-in source lock is required in both modes and is the only release
mode input. It must be canonical sorted-key UTF-8 JSON, have the exact known
top-level shape, and match the release and lock versions.

- Core-only: `sourceLock.requirements` is exactly an empty array. The generated
  catalog must also have `requirements: []`. Model-source approval, real
  fixtures, a self-hosted `capture-directml` runner, and candidate receipt are
  not required.
- Model-enabled: `sourceLock.requirements` is non-empty. It must validate as the
  exact approved OCR/Whisper set; the generated catalog must contain the exact
  two complete bound requirements; and the exact-commit candidate receipt is
  mandatory.
- Invalid: the source lock or catalog is missing, malformed, non-canonical,
  version-drifted, partial, unknown, or internally inconsistent. Invalid input
  stops the release and is never treated as an empty requirements list.

Exact-head main CI, synchronized versions, the complete workspace verification
floor, and package/runtime/installer integrity are unconditional gates.
The release workflow queries GitHub server metadata for the active trusted CI
workflow and requires exactly one completed successful `push` run on `main`
for the exact tag SHA. It rejects PR or release runs, wrong workflow identity,
event, branch, or SHA, cancelled/skipped conclusions, and ambiguous success.

The core-only runtime release directory contains no optional worker archive,
model file/ZIP, or QA fixture. The empty canonical catalog is published so the
runtime can deterministically report OCR and Whisper as unavailable with no
artifact URL. The UI presents that unavailable state and offers no installation
action. A direct installation request cannot begin a network download for an
absent catalog requirement.

## Source Lock and Catalog Contract

A canonical checked-in source lock is the only release-model input. When its
requirements are non-empty, production validation fails unless it is
explicitly approved and contains:

- lock/version/toolchain identity and approval record with no blockers;
- exact OCR and Whisper requirement IDs and artifact version;
- for every source, derived, license, and NOTICE entry: safe POSIX relative
  path, kind, canonical owner, immutable HTTPS URL/revision, exact positive
  bytes, lowercase SHA-256, SPDX/provenance, and license/NOTICE references;
- first-party OCR `model/pipeline.json` derivation with full generator commit,
  algorithm, pinned inputs, tool versions, output bytes/hash, license, and
  NOTICE;
- unique case-insensitive paths, bounded entry count, and aggregate extracted
  bytes no greater than 2 GiB per requirement; and
- one checksum-pinned real OCR fixture and one real Whisper fixture, with
  first-party copying/redistribution approval, including full immutable hex
  revisions embedded in the exact
  fixture/license URLs, byte counts and hashes, exact normalized expected text,
  exact engine/model/device provenance, and an explicitly approved Whisper
  primary/fallback preference.

First-party `pipeline.json`, license, NOTICE, and fixture bytes have a
two-commit repository/commit binding contract:

1. Commit A in `gx-capture/capture-workbench` adds the reviewed bytes only.
2. A later Commit B adds/approves the source lock and references immutable raw
   URLs containing the exact full Commit A SHA and repository identity.

Commit B must follow Commit A. The source lock must not self-reference Commit B
because the commit identity does not exist until after the lock bytes are
created. Upstream model weights remain user-directed upstream downloads; their
legal gate is download/use plus attribution/NOTICE, not model-byte
redistribution. Redistribution approval applies to bytes copied into the
first-party repository.

Every source/derived entry references embedded or separately downloaded locked
license and NOTICE entries for the same requirement. Unknown licensing,
missing owner/provenance, a mutable URL/revision, or an unresolved fixture
invalidates the lock and stops catalog/release generation.

The generated embedded engine catalog keeps worker archive descriptors and
replaces model archive descriptors with a `modelFiles` manifest equivalent.
Each model delivery descriptor contains the artifact version, aggregate bytes,
entry count, model directory entry point, and the exact ordered file records
above. Catalog parsing rejects unknown fields, unsafe paths, duplicates,
invalid URLs/hashes, entry-count drift, missing license/NOTICE references, and
aggregate mismatch.

## Direct Download and Security

For one consented requirement installation:

1. acquire the existing per-requirement exclusive install lock;
2. create a UUID-named staging directory below that requirement only;
3. download the worker archive with the existing descriptor validation;
4. for each catalog model file in ordinal path order, stream to an exclusive
   staging path with bounded retries/backoff and cancellation;
5. enforce an initial HTTPS URL without credentials/query/fragment; validate
   every redirect target before contact; allow a query only on an explicitly
   allowlisted redirected CDN host; reject credentials, fragments, downgrade,
   unknown host, malformed/missing location, and excessive hops; then enforce
   exact `Content-Length` when present, locked bytes while streaming, and
   SHA-256 at EOF;
6. flush/fsync every completed file, resolve every parent below staging, reject
   symlinks/reparse points/path collisions, and delete partial files on any
   failure;
7. enforce 512 MiB for worker, license, NOTICE, provenance, manifest, and other
   entries; only checksum-pinned paths under `model/` may be larger, bounded by
   their exact locked bytes and the 2 GiB aggregate cap;
8. run the code-only worker probe, atomically move verified worker/model trees
   into the new version, run the model probe, and only then replace
   `active.json`; and
9. on cancellation, download drift, redirect downgrade/host drift, or probe
   failure, remove this process's staging/new inactive version and retain the
   prior active state; after a hard crash, the next install acquires the
   requirement lock and removes only validated UUID staging children and
   dot-prefixed temporary-version children without following
   symlinks/reparse points or deleting active/final versions.

No download request accepts caller-supplied model metadata. Direct downloads
never log authorization material and send no bearer token to public sources.

## Nx and Release Workflow

Nx owns:

- canonical release-mode/source-lock validation;
- complete release catalog generation;
- focused direct-download/install tests; and
- an opt-in real model candidate target that downloads the locked files and
  runs real OCR/Whisper fixtures.

Ordinary CI remains lightweight and does not download real weights.

The model candidate workflow runs only on `workflow_dispatch`, on a full SHA
reachable from `main`, with `contents: read` and `actions: read` only. It
requires a self-hosted Windows x64 runner carrying the dedicated
`capture-directml` label; `windows-latest` is forbidden because it cannot prove
the product DirectML GPU lane. It uses no model cache or user secret, validates
the approved lock, performs the opt-in real installation/probes, requires
OCR `windowsml-ocr` / `pp-ocrv6-medium-windowsml` / `windowsml-dml`, requires
the lock-selected Whisper primary/fallback provenance, compares normalized
output exactly with each fixture expectation, and uploads a small receipt with
version, commit, source-lock SHA, model-manifest summaries, and asserted probe
results.

The tag workflow validates and classifies the lock before model receipt work.
For core-only it skips receipt resolution and receipt evidence assembly. For
model-enabled it resolves the receipt only through GitHub server metadata. It
requires the trusted workflow path/ID, dispatch event, success, exact head SHA,
fresh server timestamps, exactly one non-expired receipt artifact, and matching
server artifact ID/digest. After rebuilding, it requires exact equality for
runtime version, source-lock SHA-256, and ordered direct-model manifest
summaries before the installer or handoff is assembled. The candidate catalog
SHA remains audit evidence but is not compared across independent worker
builds, whose PyInstaller/ZIP bytes are not guaranteed deterministic. It
rejects replay, expiry, ambiguity, wrong workflow/event/SHA/version/source
lock/model manifest, unsuccessful runs, and tamper. It does not rebuild, stage,
upload, hand off, or publish model files/ZIPs.

The core-only release candidate contains core runtime assets, an empty canonical
catalog, core-only NSIS, size report, and the package tarball. A model-enabled
candidate additionally contains catalogued worker ZIPs/sidecars and receipt
evidence. Neither mode contains model files/ZIPs or QA fixtures. Upload uses
compression level 0 and short retention for this ordinary-sized handoff.

## Publisher

The publisher derives the canonical expected release asset names from the
complete catalog plus core runtime, worker, checksum, size-report, and installer
assets. Model file/ZIP names are forbidden. Before package publication and on
all draft/public retries it lists remote asset names and requires:

- no duplicate names;
- no unexpected names;
- a subset only during draft repair before upload; and
- exact equality after upload and for public retries.

## Acceptance Criteria

- The checked-in canonical empty-requirements lock produces a core-only empty
  catalog and release without model approval or receipt evidence.
- A non-empty blocked/unapproved lock fails before publication; an approved
  non-empty lock still requires a fresh exact-commit receipt.
- Missing, malformed, non-canonical, partial, or unknown lock/catalog
  requirements fail closed rather than selecting core-only.
- Core-only runtime requirements clearly report OCR/Whisper unavailable, the UI
  offers no install action, and no absent-requirement download begins.
- Core-only release assets contain no worker ZIP, model file/ZIP, or fixture.
- Publisher exact-asset checks accept the canonical core-only set and continue
  rejecting model ZIPs, extras, duplicates, and drift.
- Worker archive security ceilings remain unchanged.
- A checksum-pinned `model/*` direct file may exceed 512 MiB without being read
  wholly into memory; license/NOTICE/other files may not.
- Tamper, byte drift, partial download, cancellation, unsafe path, redirect
  downgrade/host drift, aggregate overflow, and probe failure leave no partial
  activation and preserve the previous active version.
- The next requirement-scoped install removes only validated hard-crash
  staging/temporary-version residue under the exclusive lock and preserves
  active/final versions and unrecognized paths.
- Candidate receipt tests cover replay, expiry, ambiguity, wrong workflow/event
  or SHA, failure conclusion, source-lock drift, artifact tamper, and
  server-digest mismatch. Receipt ZIP inspection rejects traversal, directories,
  duplicate/extra entries, non-canonical JSON, and decompressed content above
  the receipt cap before writing a new output directory.
- Publisher tests cover unexpected and duplicate draft assets plus unexpected
  public-retry assets; model ZIP names are rejected.
- The real candidate job cannot run until an authorized self-hosted Windows x64
  GPU runner is registered with the exact `capture-directml` label.
