# Standalone Desktop Product TODO

- [x] Add product boundary and private library IPC.
      Verify: `pnpm nx run capture-workbench-desktop:cargo-test`.
- [x] Replace the validation host with the desktop workspace UI.
      Verify: `pnpm nx run capture-workbench:test --skip-nx-cache`.
- [x] Make product dev/release paths use staged release runtime assets.
      Verify: `pnpm nx run capture-workbench:build --skip-nx-cache` and desktop package checks.
- [x] Add deterministic browser regression coverage for the product flow.
      Verify: `pnpm nx run capture-workbench-e2e:e2e --skip-nx-cache`.
- [x] Run focused contract/security review and the affected Nx verification floor.
      Verify: `git diff --check` plus explicit target results.
- [x] Remove the WindowsML bundle environment-variable protocol and prove a real isolated Ollama result.
      Verify: 69 runtime tests and the staged release smoke report with isolated Ollama profile provenance.
- [x] Keep checksum-pinned WindowsML installation runtime-owned and outside
      desktop artifact release gating.
      The current `v0.3.0` GitHub release does not contain the referenced OCR zip
      (HTTP 404). Capture Workbench does not bundle that archive, but the runtime
      preserves the consented installer, integrity checks, and actionable install
      failure when an OCR-capable installation is requested.
