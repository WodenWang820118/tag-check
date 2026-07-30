# Local NPM Registry Cert Prep Trial TODO

- [x] Add a loopback Verdaccio configuration and start/publish scripts.
      Verify: the registry started on `127.0.0.1:4873` and a local publish
      completed. Verdaccio 6 does not expose a separate check-config command.

- [x] Add the cert-prep isolated consumer trial script.
      Verify: the script creates a temporary consumer, runs `pnpm install`, and
      builds a Vite Web Component consumer from `@gx-capture/capture-workbench`.

- [x] Document the registry-first workflow and offline caveat.
      Verify: the commands use registry resolution rather than `file:.tgz`.

- [x] Run package and consumer verification.
      Verify: `pnpm nx run capture-angular:lint`,
      `pnpm nx run capture-angular:test`,
      `pnpm nx run capture-angular:clean-consumer-smoke`, and the cert-prep trial.
