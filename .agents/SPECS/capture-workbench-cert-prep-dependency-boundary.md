# Capture Workbench and Cert Prep Dependency Boundary

## Purpose

Keep `@angular/elements` as the implementation tool and package-owned
dependency of `@gx-capture/capture-workbench`, while removing the unused direct
`@angular/elements` dependency from cert-prep. Cert Prep consumes the public
`defineCaptureWorkbenchElement()` API; it does not create Angular custom
elements itself.

## Phases

### PR A - Capture Workbench package

- Use `@angular/elements` for the `capture-workbench` Web Component.
- Preserve property-first inputs, primitive attributes, stable DOM events, and
  the existing Angular facade.
- Keep the package dependency and let the package own its Angular Elements
  implementation dependency.

### PR B - capture-runtime artifacts

The local artifact gate is complete: verified Windows x64 runtime bytes,
checksum, manifest, schema, and downloaded runtime readiness. The release
workflow publishes the synchronized runtime/package candidate directly; the
separate clean-install evidence and GitHub attestation lane was retired as
over-designed.

### PR C - cert-prep consumer boundary

- Remove cert-prep's direct root dependency on `@angular/elements`.
- Remove the same dependency from generated local trial fixtures.
- Keep cert-prep on the public Workbench registration API and preserve backend,
  token, persistence, and runtime ownership.
- The local runtime-backed cross-project smoke is complete against the sibling
  Workbench `0.3.0` release directory: cert-prep downloads the canonical
  runtime assets through a loopback mirror, verifies the manifest/checksums and
  schema, starts the downloaded sidecar, completes the backend host-structuring
  coordinator flow, and cleans up the temporary process/install state.
- This local smoke is diagnostic consumer evidence. Publication uses the same
  runtime manifest/checksum contract without a separate clean-install gate.

## Decisions

- `@gx-capture/capture-workbench` owns the Angular Elements implementation boundary.
- Cert Prep must not import `createCustomElement`, `NgElement`, or
  `@angular/elements` directly.
- The Workbench package owns `@angular/elements` as a regular dependency pinned
  to the workspace Angular version. This lets cert-prep remove its direct
  application dependency without leaving an Angular version-mismatch peer
  warning in clean consumers.
- No change is made to `CaptureDocumentV1`, runtime HTTP, bearer-token, or
  persistence contracts.

## Acceptance Criteria

- Workbench source imports `createCustomElement` from `@angular/elements` and
  its packed manifest owns the dependency.
- Workbench Angular/Vanilla/React/Vue consumer smoke passes.
- Cert-prep root `package.json` and generated trial fixture do not declare
  `@angular/elements`.
- Cert-prep has no product-code import of `@angular/elements`.
- Cert-prep frozen offline install, relevant Nx build/test, and trial smoke
  remain valid.

## Non-Goals

- Rewriting the Workbench adapter as a native `HTMLElement` implementation.
- Adding runtime installers or changing cert-prep backend ownership.
- Removing the package required by the published Workbench implementation.
