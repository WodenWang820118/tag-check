<!-- nx configuration start -->

# Nx workspace guidance

- Use `pnpm nx` for project discovery and all build, lint, test, and packaging targets.
- Use `pnpm nx show project <name> --json` for resolved target configuration.
- Use Nx generators with `--dry-run` and `--no-interactive` before creating Angular projects.
- The Capture Workbench package is framework-facing only; native process, filesystem, and model lifecycle belong to `capture-runtime` or the Tauri harness.
- Never log or persist sidecar bearer tokens.
- Runtime jobs are ephemeral; host applications own durable source and domain persistence.
<!-- nx configuration end -->
