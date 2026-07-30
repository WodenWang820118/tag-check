# Tiered Release and Direct Model Delivery TODO

- [x] Make the canonical source-lock validator classify only exact empty
      `requirements` as core-only and require full approval for every non-empty
      requirements set. Missing, malformed, non-canonical, partial, and unknown
      input must fail closed.
      Verify: `pnpm nx run capture-runtime:test --skip-nx-cache`

- [x] Generate and package a canonical empty engine catalog for core-only
      releases, excluding optional worker archives, model files/ZIPs, and fixtures.
      Preserve the complete bound catalog path for approved model-enabled releases.
      Verify: `pnpm nx run capture-runtime:test --skip-nx-cache`

- [x] Remove the tag workflow's unconditional model-receipt coupling. Resolve,
      verify, and assemble receipt evidence only for canonical model-enabled mode;
      require exactly one trusted successful main `push` CI run for the exact tag
      SHA; keep versions, exact-main ancestry, workspace verification, size,
      package, runtime, and installer gates unconditional.
      Verify: `pnpm nx run capture-workbench-desktop:package-qa-test --skip-nx-cache`

- [x] Accept the exact core-only publisher asset set while preserving strict
      equality, checksums, idempotency, and the ban on model ZIP assets and QA
      fixtures.
      Verify: `pnpm nx run capture-workbench-desktop:package-qa-test --skip-nx-cache`

- [x] Prove the core-only runtime/UI reports OCR and Whisper as unavailable,
      offers no install action, and cannot begin a download for an absent catalog
      requirement.
      Verify: `pnpm nx run capture-runtime:test --skip-nx-cache` and
      `pnpm nx run capture-angular:test --skip-nx-cache`

- [x] Run the resolved release-owner targets and full proportionate verification
      before requesting independent review. Do not tag, publish, or create a
      Release in this implementation slice.
      Verify: `pnpm verify`

- [ ] Resolve exact Paddle/Whisper user-directed upstream download/use terms,
      required attribution/NOTICE, canonical owners/URLs/revisions, first-party
      `pipeline.json` derivation, and redistribution permission for exact
      first-party-copied pipeline/license/NOTICE/real-fixture bytes. Pin normalized
      expected text and engine/model/device provenance.

- [ ] Complete the required two-commit bootstrap in
      `gx-capture/capture-workbench`: commit approved first-party bytes first, then
      in a later source-lock commit reference immutable raw URLs at that earlier
      full commit SHA. The source lock must not self-reference its own commit.
      Encode the resulting exact bytes/hashes and repository/commit binding.
      Verify: `pnpm nx run capture-runtime:validate-model-source-lock --skip-nx-cache`.

- [ ] Obtain explicit authorization, register, and secure a self-hosted Windows
      x64 GPU runner with the exact `capture-directml` label. GitHub-hosted
      `windows-latest` is not acceptable evidence for the DirectML product lane.

- [ ] After both prerequisites above are satisfied, dispatch the real model
      candidate workflow for the exact full commit SHA and retain a successful
      non-expired receipt proving:
  - OCR engine/model/device exactly
    `windowsml-ocr` / `pp-ocrv6-medium-windowsml` / `windowsml-dml`;
  - the lock-approved Whisper primary/fallback engine/model/device path;
  - exact normalized fixture output; and
  - exact fixture plus fixture-license bytes/SHA-256.

The unresolved legal/source/fixture/runner items above block only the
model-enabled lane. The canonical empty-requirements core-only lane remains
eligible after its unconditional CI, version, package, runtime, installer, and
integrity gates pass. Commit, tag, release, package publication, runner
registration, and machine configuration require separate explicit
authorization.
