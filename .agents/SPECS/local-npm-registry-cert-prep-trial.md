# Local NPM Registry Cert Prep Trial Spec

## Purpose

Provide a reproducible Windows-local workflow that publishes the packed
`@gx-capture/capture-workbench` package to a localhost Verdaccio registry and lets a
`cert-prep` consumer install it through normal `pnpm install` resolution.

## Non-goals

- Do not change the public package name or publish it to GitHub Packages.
- Do not write localhost registry settings into cert-prep's normal CI or shared
  `.npmrc` configuration.
- Do not replace cert-prep's existing `@cert-prep/capture-ui` or source-import
  transport in this trial.
- Do not persist registry credentials or sidecar bearer tokens.

## Interfaces

- Registry: `http://127.0.0.1:4873`.
- Scope mapping: `@gx-capture` resolves from the local registry.
- Public package: the current version of `@gx-capture/capture-workbench` (currently
  `0.3.0`).
- Local publisher: packs the Angular library and publishes the tarball to
  Verdaccio with the `local` dist-tag.
- Cert Prep consumer: an isolated temporary Vite/Web Component fixture created
  by the cert-prep trial script; it installs from the local registry and builds
  the package without changing cert-prep's root dependency manifest.

## Key decisions

- Use the existing capture-workbench Verdaccio dev dependency.
- Keep Verdaccio storage outside the repository's tracked files.
- Use an npmjs uplink for ordinary dependency resolution; a truly offline run
  additionally requires the dependencies to be present in the local pnpm store.
- Verify package installation and browser-bundle consumption separately from
  the CaptureClient/backend contract integration.

## Acceptance criteria

- Verdaccio starts on loopback with a checked-in local-only configuration.
- The current package tarball can be published as `@gx-capture/capture-workbench`.
- The cert-prep trial script runs `pnpm install` against the local registry.
- The installed package is imported, custom-element registration is called, and
  a Vite production build succeeds.
- Normal cert-prep package.json, pnpm-lock.yaml, CI registry, and source-import
  files remain unchanged by the trial command.

## Test plan

- Start Verdaccio and publish the package.
- Run the cert-prep local consumer trial against the registry.
- Inspect the generated consumer output and registry package metadata.
- Run the existing capture-workbench package lint/build/consumer smoke targets.
