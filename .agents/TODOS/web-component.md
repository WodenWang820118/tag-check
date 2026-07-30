# Web Component follow-up

- [x] Replace the manual element adapter with an Angular Elements facade and
      rename the direct Angular selector to `gx-capture-workbench`.
      Verify: `pnpm nx run capture-angular:test`
- [x] Add property-first configuration, common primitive attributes, and stable
      bubbling/composed capture events without JSON configuration parsing.
      Verify: `pnpm nx run capture-angular:test`
- [x] Prove packed Vanilla, React, and Vue consumers compile against the public
      NPM package API.
      Verify: `pnpm nx run capture-angular:clean-consumer-smoke`
- [x] Document framework-neutral NPM use and browser token boundaries.
      Verify: `pnpm nx run capture-angular:clean-consumer-smoke`
