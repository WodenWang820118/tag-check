# Promise to Observable Migration Decisions

## Accepted breaking contract

The current request explicitly authorizes replacing the published
`@gx-capture/capture-workbench` Promise contracts. No Promise compatibility adapter or
dual overload is retained. The package version moves from `0.1.0` to `0.2.0`.

## Resource selection

`rxResource` is the single Angular resource strategy for this migration. Angular
`resource` requires a `PromiseLike` loader, while `httpResource` would bypass the
custom injectable fetch adapter that validates loopback destinations before
resolving bearer tokens. The custom adapter remains and exposes Observables.

The handshake keeps `forkJoin` inside `rxResource` and bounds each one-shot
stream with `take(1)`. This preserves the two-request handshake while avoiding a
browser fetch/Response completion edge case that otherwise left the resource in
`loading` during the Tauri consumer E2E fixture.

## Command selection

Workbench UI commands remain action-style `void` to preserve template ergonomics.
The store/services subscribe internally with lifecycle cleanup; Observable client,
provider, preprocessor, polling, and transport contracts remain composable.

## Allowed Promise boundaries

Native Promise behavior may exist only behind thin wrappers for fetch and
`Response.json`, Angular application/bootstrap and test fixture APIs, Tauri
`invoke`, Node filesystem/process APIs, and Playwright test-runner APIs. The
boundary checker must keep this list explicit and must reject Promise contracts,
constructors, and async functions in first-party workflow code.

## Deliberately unchanged

Capture Runtime Python/Rust code, HTTP routes and payloads, JSON schema, token
ownership, loopback policy, idempotency behavior, retry semantics, and host
structuring/reconciliation business rules are outside this migration.
