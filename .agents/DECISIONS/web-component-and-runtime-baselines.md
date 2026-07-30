# Web Component and Runtime Baselines Decisions

- Change mode: mixed.
- Existing owner: `packages/capture-angular` owns the Angular component and its
  public package surface; root `tools/` owns release and consumer checks.
- Delete candidates: the five root `tools/*.mjs` files, the nine desktop
  harness `scripts/*.mjs` files, and every reference to their old extensions;
  the old `@wodenwang820118` npm scope references. ESLint flat configurations
  remain `.mjs` because the installed ESLint loader owns them.
- New owner needed: yes. An Angular Elements facade owns browser-facing
  properties, primitive attribute normalization, and DOM event dispatch; the
  existing component continues to own capture behavior.
- Token posture: compact quality. The wrapper is deliberately thin and does
  not create a parallel capture contract.
- Verification floor: component unit tests, clean-consumer packaging smoke,
  package QA tests, and the workspace verification command.

The hand-written custom-element constructor is retired in favour of
`@angular/elements`. The facade is deliberately separate from the Angular
component so the browser tag `capture-workbench` does not collide with the
direct Angular selector `gx-capture-workbench`. It preserves bubbling,
composed capture events explicitly, while Angular Elements owns mounting,
unmounting, and input synchronization. Complex configuration and object
dependencies are property-first; only a small common primitive attribute set is
documented. The JSON configuration attribute and `capture-config-error` are
intentional 0.x breaking-change removals.

The npm scope changes to `@gx-capture` only. GitHub URLs retain their real owner
`WodenWang820118`; changing them would point releases and schema identifiers at
a repository that does not exist. The same distinction applies to copyright.

Node 24 provides native type stripping for the converted root tool scripts, so
no runtime transpiler or new tool dependency is introduced. `packageManager`
pins the lowest supported pnpm 11 release, while `engines.pnpm` rejects older
clients. pnpm 11's explicit `allowBuilds` map keeps the reviewed Angular/Nx
native helpers enabled while denying the unused `less` lifecycle script; it is
not a blanket approval for future dependencies.
