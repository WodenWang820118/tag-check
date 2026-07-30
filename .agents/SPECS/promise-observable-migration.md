# Promise to Observable Migration Spec

## Purpose

Replace first-party TypeScript Promise-based asynchronous contracts and workflows
with RxJS Observable contracts and Angular 22 `rxResource` state, without
changing the Capture Runtime wire contract, schema, persistence, token ownership,
or user-visible capture behavior.

## Scope and non-goals

- Scope includes first-party TypeScript under `apps/`, `packages/`, and `tools/`,
  including tests, fixtures, generated consumer smoke source, desktop scripts,
  and e2e support.
- Python and Rust remain unchanged.
- Fetch, Angular, Tauri, Playwright, and Node APIs may retain their native
  Promise boundary internally, but first-party public contracts and workflow
  code must not expose or construct Promise-based APIs.
- No HTTP route, JSON schema, idempotency, persistence, or authentication change.

## Interfaces

- `CaptureClient` methods return `Observable<T>`.
- `CaptureStructuringProvider.structure` and `CapturePreprocessor.preprocess`
  return `Observable<T>`.
- Reconciliation context read helpers return `Observable<T>`.
- `defineCaptureWorkbenchElement` returns `Observable<void>` and remains
  idempotent per tag name.
- UI commands remain action-style `void`; their work is started by lifecycle-
  managed RxJS subscriptions and state/events expose outcomes.
- Angular async state is exposed through `rxResource` and computed signals.

## Key decisions

- Use `rxResource`, not `resource` or `httpResource`, because the injectable
  client is Observable-based and the custom fetch adapter owns loopback/token
  safety rules.
- Keep mutations outside resource cancellation semantics; use Observable command
  pipelines with explicit retry, cancellation, reconciliation, and cleanup.
- Do not use `firstValueFrom`, `lastValueFrom`, `toPromise`, `new Promise`, or
  first-party `async`/`await` as an interop shortcut.
- Keep the existing custom fetch adapter instead of introducing `HttpClient`.
- Version the published Capture Workbench package as `0.2.0` for the breaking contract.

## Failure and lifecycle rules

- Unsubscribe and `AbortSignal` must cancel in-flight reads and polling.
- Capture polling remains sequential, stops at terminal states, and stops at
  `awaiting_structuring` when the component owns host structuring.
- Uncertain create/install responses retain their existing bounded retry rules.
- Lost commit/failure/cancel responses retain reconciliation behavior.
- Bearer tokens are resolved only after loopback URL validation and are never
  logged, serialized, or placed in URLs.

## Acceptance criteria

- All first-party async contracts compile as Observable-based declarations.
- Angular runtime, polling, installation, workflow, reconciliation, and UI state
  retain current observable behavior.
- Angular, app, desktop, tools, consumer smoke, and e2e tests pass.
- A workspace async-boundary check reports only explicitly allowlisted native or
  test-runner boundaries.
- Implementation evidence (2026-07-23): public and generated package
  declarations contain no Promise contracts; the async-boundary target passes
  with only Playwright, Angular/Node test-runner, and generated consumer
  fixture exceptions. The runtime handshake uses `rxResource` with `forkJoin`
  and `take(1)` on both one-shot streams so browser fetch/Response completion
  cannot leave the resource in `loading`.
- `@gx-capture/capture-workbench` consumers and README examples use the new contract.

## Test plan

- Test HTTP Observable coldness, response/error mapping, security ordering,
  abort/unsubscribe, and idempotency.
- Test `rxResource` state transitions, reload, polling order, terminal cleanup,
  host stop, and late-result suppression.
- Replace Promise test doubles with `of`, `defer`, `Subject`, `NEVER`, RxJS
  TestScheduler, or `fakeAsync` as appropriate.
- Run Nx lint, typecheck, unit tests, builds, consumer smoke, desktop smoke, and
  Playwright e2e before closeout.
