# Tiered Release and Direct Model Delivery Decisions

## Scope and Evidence

- Scope is only `gx-capture/capture-workbench`; no `cert-prep` file, artifact,
  workflow, package, or repository may be read or changed.
- The initial NSIS remains core-only. Worker ZIPs remain optional GitHub
  Release assets. Model ZIPs are not built, staged, handed between jobs, or
  published.
- Existing runtime installation is explicit-consent only. This decision does
  not add background prefetch, implicit installation, or a new endpoint.
- Exact OCR/Whisper user-directed upstream download/use terms, required
  attribution/NOTICE, canonical source ownership, first-party `pipeline.json`
  derivation, and redistribution permission for first-party-copied
  license/NOTICE/fixture bytes remain unresolved. Model-enabled catalog
  generation must fail closed until those prerequisites are approved.

## Approved Two-Tier Release Classification

The user approved a core-only / model-enabled release scheme on 2026-07-30.
The existing source-lock validator, engine-catalog generator, tag workflow, and
publisher remain the only owners. No parallel publication workflow or bypass
flag is added.

Release mode is derived only from a canonical checked-in source lock and the
canonical catalog it generates:

- `requirements: []` is core-only. The lock must still be present, canonical,
  version-synchronized, and structurally valid, but model-source approval,
  fixtures, a `capture-directml` runner, and a model-candidate receipt do not
  gate this mode.
- A non-empty `requirements` list is model-enabled. It must be the exact
  approved OCR/Whisper set and satisfy every immutable source, license, NOTICE,
  fixture, DirectML runner, fresh exact-commit receipt, and catalog-binding
  gate.
- A missing, malformed, non-canonical, version-drifted, partial, or unknown
  requirements value is invalid. It is never reclassified as core-only.

The core-only catalog has `requirements: []`. Its release directory and GitHub
Release contain only the core runtime, schema/manifest/checksums, empty engine
catalog, size evidence, NSIS installer, and package tarball. Optional worker
archives, model files/ZIPs, and QA fixtures are absent. Runtime requirement
reporting exposes OCR and Whisper as unavailable with no downloadable artifact,
and an installation attempt fails before any download begins.

Exact-head main CI, synchronized versions, and package/runtime/installer
integrity remain mandatory in both modes.

The tag workflow resolves exact-head CI through GitHub server metadata for the
active checked-in `.github/workflows/ci.yml` workflow. It requires exactly one
completed successful `push` run whose `head_branch` is `main` and whose
`head_sha` equals the tag commit. A PR run, release-workflow run, wrong event,
branch, SHA, workflow path/ID, cancelled/skipped result, malformed metadata, or
ambiguous successful run fails closed.

## Approved Delivery Scheme

The user approved delivery scheme 2 on 2026-07-30: after explicit installation
consent, the runtime downloads checksum-pinned model files directly from their
immutable upstream URLs.

The embedded release catalog contains, or checksum-pins, the manifest
equivalent:

- requirement and artifact version;
- immutable HTTPS URL and revision for every file;
- safe relative destination path;
- exact byte count and SHA-256;
- kind and canonical owner;
- SPDX/provenance metadata; and
- references to separately pinned license and NOTICE entries.

No runtime request may resolve `latest`, a branch, a mutable model alias, or a
caller-provided URL/hash/path. Redirects remain HTTPS, credential-free, and on
the approved canonical host set; redirected bytes must still match the
original locked length and SHA-256.

First-party `pipeline.json`, license, NOTICE, and fixture bytes use a mandatory
two-commit bootstrap in `gx-capture/capture-workbench`. Commit A adds the
reviewed bytes. A later commit B adds/approves the source lock, whose first-party
URLs name the exact repository and full Commit A SHA (for example an immutable
`raw.githubusercontent.com/gx-capture/capture-workbench/<commit-a>/...` URL).
Commit B must be reachable after Commit A and the source lock may not reference
Commit B itself: a checked-in lock cannot truthfully self-reference bytes at its
own not-yet-existing commit.

## Installation and Activation

- Worker archives retain the existing descriptor, bounded downloader, safe ZIP
  extraction, inner manifest verification, and 512 MiB entry ceiling.
- Model delivery uses a requirement-scoped unique staging directory. Each file
  is streamed with bounded retries, cancellation, exact length/SHA-256,
  per-file and aggregate limits, safe path resolution, flush/fsync, and partial
  cleanup.
- Only checksum-pinned `model/*` entries may exceed 512 MiB. Their exact locked
  bytes/SHA-256 and the aggregate extracted limit are independent gates.
  License, NOTICE, provenance, manifest, worker, and other files retain the
  512 MiB ceiling.
- Activation is atomic only after the worker is installed, every model file is
  verified, the code-only worker probe succeeds, and the post-install model
  probe succeeds. Cancellation, network failure, drift, or probe failure
  removes staging and preserves the previous active version.
- A same-process failure removes its own residue in `finally`. A hard-crash
  residue is removed at the next installation, after acquiring the same
  per-requirement exclusive lock. That sweep removes only UUID-named staging
  children and validated dot-prefixed temporary-version children, does not
  follow symlinks/reparse points, and never removes an active/final version.

## Release and Receipt Trust

For model-enabled releases, the pre-tag candidate workflow remains explicit
`workflow_dispatch`, read-only, and non-publishing. Once the legal/source lock
is approved, it
performs the normal consent-equivalent direct downloads on an explicitly
labeled self-hosted Windows x64 DirectML runner, verifies real OCR and Whisper
fixtures, and uploads only a small canonical receipt. GitHub-hosted
`windows-latest` does not prove the product DirectML GPU lane and is forbidden
for this job.

The tag workflow first derives the release mode from the canonical checked-in
lock. Core-only releases do not query or copy candidate-receipt evidence.
Model-enabled releases grant `actions: read` to `build-candidate` and trust
GitHub server-side metadata, not receipt claims:

- checked-in candidate workflow path and stable workflow ID;
- `workflow_dispatch`, successful conclusion, exact full head SHA and version;
- exact source-lock SHA;
- exactly one fresh, non-expired run and receipt artifact;
- server run/artifact IDs and GitHub-reported artifact digest; and
- no caller-provided URL, run ID, artifact ID, timestamp, or hash override.

Replay, expiry, ambiguity, wrong workflow/event/SHA/version/lock, unsuccessful
run, artifact tamper, or server-digest mismatch fails before candidate work.
The tag workflow rebuilds workers/runtime, then requires the rebuilt catalog's
exact runtime version, source-lock SHA, and ordered direct-model manifest
summaries to equal the receipt. Candidate catalog SHA remains audit evidence;
it is not a gate because independent PyInstaller/worker ZIP builds are not
byte-deterministic. The workflow then builds the core-only NSIS/package and
hands those ordinary release assets to `publish`; model files and model ZIPs
are absent from the handoff.

## Publisher Contract

Before any package publication and on every retry, the publisher requires the
remote GitHub Release asset-name set to equal the local canonical set exactly.
Draft releases may initially be a subset only while missing assets are
uploaded. Extras and duplicate names always fail closed. Model ZIP/manifest
names are never in the expected release set.

## Rejected or Superseded Designs

- Deterministic combined model ZIP publication and the approximately 2.5 GB
  Actions candidate handoff are superseded. Their ZIP64, compression-level,
  artifact quota, retention, and multi-gigabyte timeout requirements are
  removed.
- Runtime resolution of mutable upstream names is rejected.
- Chunk/reassembly and a smaller Whisper model remain unnecessary for this
  delivery scheme.
- First-party hosting remains a separate future decision if immutable upstream
  availability is inadequate.

## Remaining Model-Enabled Blockers

- Approve exact PaddleX/PaddleOCR user-directed upstream download/use terms,
  canonical owner, and required attribution/NOTICE.
- Approve first-party copying/redistribution of the exact `pipeline.json`,
  license, NOTICE, and real OCR/Whisper fixture bytes.
- Commit those approved first-party bytes first, then in a later source-lock
  commit bind their immutable raw URLs to the earlier full
  `gx-capture/capture-workbench` commit SHA; the lock cannot self-reference.
- Record `pipeline.json` derivation with generator commit, pinned inputs,
  deterministic algorithm/tool versions, bytes/SHA-256, license, and NOTICE.
- Confirm the redirected Whisper primary owner, user-directed upstream
  download/use terms, and required attribution/NOTICE for both snapshots.
- Register and secure an authorized self-hosted Windows x64 GPU runner with the
  exact `capture-directml` label; the repository currently has no such runner.

These blockers prevent only a model-enabled release. They do not block a
core-only release whose canonical source lock and generated catalog both have
an empty `requirements` list.
