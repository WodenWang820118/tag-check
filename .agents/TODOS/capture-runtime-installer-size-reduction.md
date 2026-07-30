# Capture Runtime Installer Size Reduction TODO

- [ ] Record reproducible pre-change runtime/NSIS/installed/startup and
      PyInstaller inventory evidence without invented values.
      Verify: `corepack pnpm nx run capture-runtime:bundle-size-report --skip-nx-cache`.

- [x] Replace dynamic monolithic PyInstaller collection and slim core
      dependencies (`uvicorn`, PDF core, OCR/Whisper isolation).
      Verify: `corepack pnpm nx run capture-runtime:build-core-executable --skip-nx-cache`.

- [x] Implement catalog, worker protocol/client/process ownership, safe engine
      installation, atomic activation, concurrency, rollback, and offline probes.
      Verify: `corepack pnpm nx run capture-runtime:test --skip-nx-cache`.

- [x] Build separately packaged OCR and Whisper workers with deterministic
      files manifests and ZIP archives.
      Verify: `corepack pnpm nx run capture-runtime:build-ocr-worker --skip-nx-cache`
      and `corepack pnpm nx run capture-runtime:build-whisper-worker --skip-nx-cache`.

- [x] Route scanned PDF/image/audio extraction through installed workers while
      retaining embedded PDF text extraction in core and exact provenance.
      Verify: focused extractor/worker integration tests plus
      `corepack pnpm nx run capture-runtime:test --skip-nx-cache`.

- [ ] Generate a runtime-owned catalog and exact release assets/manifests.
      Verify: `corepack pnpm nx run capture-runtime:generate-engine-catalog --skip-nx-cache`
      and release consistency tests.

- [x] Stage and build a core-only NSIS installer and enforce core/worker/NSIS
      boundaries.
      Verify: `corepack pnpm nx run capture-runtime:verify-core-boundary --skip-nx-cache`,
      `corepack pnpm nx run capture-runtime:verify-worker-boundaries --skip-nx-cache`,
      and `corepack pnpm nx run capture-workbench-desktop:build-nsis`.

- [x] Record measured post-change size/startup data and set evidence-backed
      Windows x64 budgets with CI regression gates/uploads.
      Verify: `corepack pnpm nx run capture-runtime:size-regression-check --skip-nx-cache`.

- [ ] Prove real DirectML OCR on a scanned PDF with non-empty OCR,
      `windowsml-dml` provenance, and no worker residue.
      Verify: `corepack pnpm nx run capture-workbench-desktop:smoke-real-desktop-ocr-directml`.

- [ ] Prove real Whisper audio segments/time locators/provenance/offline restart
      and no worker residue.
      Verify: the opt-in real Whisper smoke target with a user-provided audio
      fixture and prepared catalog assets.

- [ ] Prove real isolated Ollama raw extraction, structuring,
      `CaptureDocumentV1`, persistence, and cleanup.
      Verify: `corepack pnpm nx run capture-workbench-desktop:smoke-real-ollama`.

- [x] Run the full repository verification floor and keep any unavailable
      external/publication evidence explicit.
      Verify: runtime lint/typecheck/test/build, desktop Rust/package QA, worker
      boundary/release checks, `git diff --check`, and `corepack pnpm verify`.

- [x] Harden cross-process install locking, Windows ZIP paths/manifest bounds,
      and configured DirectML device probing, then refresh exact binary evidence.
      Verify: focused lock/archive/device regressions, runtime lint/typecheck/test,
      rebuilt onefile core and core-only NSIS, installed-size/uninstall proof,
      boundary/catalog/release/publisher checks, and `corepack pnpm verify`.
