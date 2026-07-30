# Capture Runtime Release and External Ollama TODO

- [ ] Add the v0.3.0 external Ollama configuration and provider contract.
      Verify: focused external-provider pytest tests.

- [ ] Add API tests for external mode requirement scoping and runtime
      capabilities.
      Verify: `corepack pnpm nx run capture-runtime:test --skip-nx-cache`.

- [ ] Repair release-version argument/path handling and synchronize runtime
      protocol metadata at v0.3.0.
      Verify: `corepack pnpm verify:release-version -- v0.3.0`.

- [ ] Document standalone executable and HTTP API quick start.
      Verify: README contains launch, readiness, upload, polling, and external
      Ollama examples without placing secrets in URLs.

- [ ] Verify package and release artifacts locally.
      Verify: `corepack pnpm nx run capture-runtime:lint --skip-nx-cache`,
      `corepack pnpm nx run capture-runtime:typecheck --skip-nx-cache`,
      `corepack pnpm nx run capture-runtime:test --skip-nx-cache`,
      `corepack pnpm nx run capture-runtime:build --skip-nx-cache`, and the
      canonical release-artifact check.

- [ ] Review the final diff and leave unrelated local registry worktree changes
      untouched.
      Verify: `git diff --check` and explicit status review.
