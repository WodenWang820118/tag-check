# Promise to Observable Migration TODO

- [x] Add and review migration spec, decision record, and async-boundary policy.
      Verify: `git diff --check`

- [x] Convert public contracts and `HttpCaptureClient` to Observable APIs.
      Verify: `pnpm nx test capture-angular --skip-nx-cache`

- [x] Convert Angular runtime state, polling, installation, workflow, and
      reconciliation to `rxResource`/Observable pipelines.
      Verify: `pnpm nx test capture-angular --skip-nx-cache && pnpm nx lint capture-angular --skip-nx-cache`

- [x] Convert app fixtures, deferred client, element registration, consumer
      smoke source, desktop scripts, and tools.
      Verify: `pnpm nx build capture-angular --skip-nx-cache && pnpm nx build capture-workbench --skip-nx-cache`

- [x] Rewrite unit, integration, desktop, and consumer tests and add the
      workspace async-boundary checker.
      Verify: `pnpm nx run-many -t lint,typecheck,test --parallel=false --skip-nx-cache`

- [x] Run package, desktop, and e2e acceptance lanes.
      Verify: `pnpm nx run capture-angular:clean-consumer-smoke; pnpm nx run capture-workbench-desktop:smoke-deterministic; pnpm nx run capture-workbench-e2e:e2e`

- [x] Review generated declarations, remaining Promise occurrences, security
      boundaries, and documentation; mark this TODO complete only with evidence.
      Verify: `pnpm nx run-many -t lint,typecheck,test,build --parallel=false --skip-nx-cache`

## Evidence

- `pnpm nx run-many -t lint --parallel=false --skip-nx-cache`: passed; the
  async-boundary check reported only approved framework/test occurrences.
- `pnpm nx run-many -t typecheck --parallel=false --skip-nx-cache`: passed for
  `capture-angular`, `capture-workbench`, and `capture-runtime`.
- `pnpm nx run-many -t test --parallel=false --skip-nx-cache`: passed: Angular
  50, app 9, runtime 80.
- `pnpm nx run-many -t build --parallel=false --skip-nx-cache`: passed for
  Angular, app, desktop Tauri, and runtime.
- Consumer smoke passed for Angular, Vanilla, React, and Vue; desktop
  deterministic smoke passed; Playwright E2E passed 5/5; desktop package QA
  passed 23/23.
