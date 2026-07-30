# Capture Workbench and Cert Prep Dependency Boundary TODO

## PR A - Capture Workbench

- [x] Restore `@angular/elements` and `createCustomElement` in the Workbench
      adapter.
      Verify: `pnpm nx run capture-angular:test`
- [x] Re-run Workbench typecheck, lint, build, pack, and clean consumer smoke.
      Verify: `pnpm nx run capture-angular:lint`, `typecheck`, `test`, `build`,
      `pack`, and `clean-consumer-smoke`

## PR B - capture-runtime

- [x] Start after PR A package evidence is complete.
      Verify: PR A verification evidence
- [x] Verify local runtime artifact bytes, checksum, manifest, schema, NSIS
      installer staging, and downloaded runtime readiness.
      Verify: `pnpm nx run capture-runtime:build-release-artifacts`,
      `pnpm nx run capture-runtime:local-release-consumer-smoke`,
      `node --test tools/local-release-consumer-smoke.test.ts`, and
      `pnpm nx run capture-workbench-desktop:build-nsis`

## PR C - cert-prep

- [x] Remove cert-prep root and generated trial-fixture direct dependency on
      `@angular/elements`.
      Verify: targeted cert-prep `rg` scan
- [x] Verify frozen install, cert-prep build/test, and registry trial smoke.
      Verify: `pnpm nx run cert-prep:build`, `pnpm nx run cert-prep:test`, and
      `pnpm trial:capture-workbench`
- [x] Run the local runtime-backed cross-project smoke after the PR B local
      artifact gate.
      Verify: `pnpm nx run cert-prep-desktop:capture-runtime-consumer-smoke
    --skip-nx-cache`
