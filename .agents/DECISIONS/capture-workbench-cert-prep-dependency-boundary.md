# Capture Workbench and Cert Prep Dependency Boundary Decisions

- Change mode: mixed.
- Existing owner: `packages/capture-angular` owns the Workbench Angular
  Elements adapter; cert-prep owns its host route and backend client.
- Delete candidates: cert-prep's direct root `@angular/elements` dependency and
  the same direct dependency in generated trial fixtures.
- New owner needed: no. The published Workbench package remains the owner of
  custom-element creation and owns `@angular/elements` as a dependency.
- Verification floor: Workbench package smoke plus cert-prep frozen install,
  build/test, and local registry trial.

## Rationale

Cert-prep uses `defineCaptureWorkbenchElement()` and the typed DOM properties;
it does not use Angular Elements APIs directly. The Workbench package owns its
implementation dependency, so cert-prep can remove the unused direct
application dependency without an unmet peer warning.

## Rejected Alternative

Moving the Workbench implementation to a hand-written native `HTMLElement`
adapter is rejected for this plan; the user explicitly selected Angular
Elements as the Workbench Web Component tool.

## Scope Boundary

Do not change cert-prep's backend/runtime/token ownership, route contract,
document persistence, or the Workbench public API. Do not mix runtime artifact
release work into this dependency correction.
