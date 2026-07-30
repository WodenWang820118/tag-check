# Web Component and Runtime Baselines

## Purpose

Ship `capture-workbench` as a framework-neutral, property-first custom element
without changing `CaptureDocumentV1`. Angular Elements owns custom-element
lifecycle and input synchronization; the package remains an NPM ESM library.

## Interfaces

- `defineCaptureWorkbenchElement()` registers the `capture-workbench` custom
  element through `@angular/elements` and resolves after its Angular application
  context is available.
- `config`, `client`, `structuringProvider`, and `preprocessor` are object-only
  properties. `config` accepts the full `CaptureWorkbenchConfig`; no JSON
  configuration attribute is supported.
- The supported primitive attributes are `output-mode`, `multiple`,
  `target-language`, `show-runtime-setup`, `width`, `height`, and `density`.
  Explicit values in `config` take precedence over these attributes; invalid
  enum attributes are ignored.
- `client`, `structuringProvider`, and `preprocessor` never accept attribute
  strings as usable dependencies and no credential-bearing value is serialized
  to an attribute.
- DOM events are stable, bubbling, composed `CustomEvent`s:
  `capture-completed`, `capture-failed`, `capture-canceled`, and
  `capture-task-changed`.
- Direct Angular template consumers use `gx-capture-workbench`; the public
  `capture-workbench` tag is reserved for the custom element.
- The publishable package name becomes `@gx-capture/capture-workbench`. The actual
  GitHub repository owner, release URLs, and copyright holder stay unchanged.
- `tools/*.mjs` and desktop harness `scripts/*.mjs` become `.ts`; Node 24
  executes these type-strippable TypeScript files directly. ESLint's flat
  configuration files remain `.mjs`, because they are tool configuration rather
  than application or verification scripts.
- The workspace requires Node `>=24.0.0` and pnpm `>=11.0.0`.

## Non-goals

- Changing the `CaptureDocumentV1` schema, runtime API, or provenance rules.
- Moving or renaming the existing GitHub repository.
- Serializing a `CaptureClient`, provider, preprocessor, or bearer token into
  HTML attributes.
- Retaining the retired JSON configuration attribute or `capture-config-error`.
- Publishing a standalone browser/CDN bundle or framework-specific adapters.
- Converting ESLint flat-configuration files, which are loaded by the existing
  ESLint toolchain rather than executed as workspace scripts.

## Edge Cases

- An element can be disconnected and reconnected; its component view and
  Angular Elements lifecycle is always cleaned up before remounting.
- Repeated registration of the same tag is idempotent. A supplied tag name
  must be a valid custom-element name.

## Acceptance Criteria

- Vanilla, React, and Vue fixtures can register, configure, and consume
  `capture-workbench` through standard DOM properties and stable event names.
- The facade forwards object properties and common primitive attributes to the
  Angular component without changing `CaptureDocumentV1` contracts.
- All root `tools/*.mjs` and desktop harness `scripts/*.mjs` files and their
  references are replaced by `.ts`.
- Every published package/import reference uses `@gx-capture/capture-workbench`.
- Local and CI configuration enforce Node 24 and pnpm 11 or newer.

## Verification

- `pnpm nx run capture-angular:test`
- `pnpm nx run capture-angular:clean-consumer-smoke`
- `pnpm nx run capture-workbench-desktop:package-qa-test`
- `pnpm verify`
