# Standalone Desktop Product Decisions

- Change mode: mixed.
- Existing owners: the Angular app owns desktop presentation; the Tauri host
  owns local filesystem state and runtime lifecycle; capture-runtime owns
  extraction and isolated Ollama.
- Delete candidates: validation-host copy, browser fixture/provider switching,
  and the misleading default deterministic dev entry point.
- New owner: a Tauri private library with opaque document IDs, because runtime
  jobs are intentionally ephemeral and host data must survive restart.
- The library uses versioned JSON plus atomic file replacement rather than a
  new database dependency. This keeps the existing dirty `Cargo.toml` outside
  the slice.
- Bearer tokens remain exclusively in the native host. The renderer invokes a
  constrained native runtime proxy and receives only redacted runtime values;
  tokens are absent from IPC contracts, library files, and diagnostics.
- The WindowsML bundle descriptor is a release-versioned capture-runtime
  constant, not a CI/Tauri/runtime environment-variable protocol. It is the
  single owner for the consented OCR download and checksum verification.
- A missing remote WindowsML archive is an installer repair condition, not a
  Capture Workbench desktop release gate. The app does not bundle or launch the
  archive, while runtime requirement discovery and the consented installation
  path remain intact for OCR-capable installations.
- The desktop renderer uses Angular Material 22.0.6, selected because its peer
  dependencies support the workspace's Angular 22 runtime. Bootstrap supplies
  asynchronous animations and the build loads the Material prebuilt theme;
  Material controls are imported by the standalone app component and covered
  by browser regression tests.
