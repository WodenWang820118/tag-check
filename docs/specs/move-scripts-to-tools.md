# Spec: Move `scripts` Under `tools`

- **Status:** Draft
- **Author:** Codex
- **Last Updated:** 2026-04-23
- **Related Issues:** N/A

---

## 1. Objective

Move the repository root `scripts/` directory into `tools/scripts/` without refactoring the script internals. The goal is to group repo tooling under `tools/` while preserving current behavior, command entrypoints, and test coverage.

## 2. Technical Design

### Tech Stack

- **Language/Framework:** TypeScript, Node.js, Nx workspace
- **API (if applicable):** N/A
- **Database (if applicable):** N/A
- **Key Libraries/Dependencies:** Node `--experimental-strip-types`, Vitest, Nx run-commands

### Assumptions

- The requested move means relocating the existing root `scripts/` folder to `tools/scripts/`.
- Existing filenames and subdirectory layout remain unchanged.
- This task should not introduce new abstractions, rename commands, or split the scripts into libraries during this pass.

### Commands

- **Plan review:** `pnpm review:plan`
- **Gate approval:** `pnpm review:approve-pre-implementation -- --reviewer <provider> --focus tooling --summary "<summary>"`
- **Targeted tests:** `pnpm test -- --runInBand` is out of scope; use direct Vitest file execution or targeted `pnpm` script checks as needed.

### Project Structure

```text
tools/
  scripts/                          <-- Moved from repo root
    proofshot.ts
    proofshot.test.ts
    review/
    review-gate/
    tauri/
```

### Impacted References

- A required repository-wide audit for `scripts/` references before moving files
- Root `package.json` scripts invoking files under `scripts/`
- `apps/desktop-tauri/project.json` prepare-runtime command
- `vitest.workspace.ts` test glob for script tests
- `eslint.config.mjs` ignore patterns for `scripts/**`
- `.github/workflows/build.yml` direct script invocations
- `README.md` path references in review-gating guidance
- Other Nx `project.json` / `run-commands` targets that may invoke script paths
- Git hooks, workflow files, or config files that reference script paths directly
- Script-source literals and tests that reference `scripts/...`
- Documentation that names current script paths

### Code Style & Patterns

Representative path update:

```json
{
  "review:status": "node --experimental-strip-types tools/scripts/review-gate/status.ts"
}
```

## 3. Testing Strategy

- **Unit Tests:** Keep existing `*.test.ts` files under the moved tree runnable from their new location.
- **Integration Tests:** Validate the repo entrypoints that invoke moved scripts, focusing on review-gate and Tauri runtime preparation path resolution.
- **End-to-End (E2E) Tests:** None for this task.

## 4. Boundaries & Non-Goals

- Do not refactor script implementation logic.
- Do not split the moved scripts into new packages, executors, or libraries.
- Do not rename the npm script commands in `package.json`.
- Do not redesign review-gate, proofshot, or Tauri workflow behavior.
- Do not leave newly stale `scripts/...` references behind anywhere in the repository once the move is complete.

## 5. Success Criteria

- [ ] The root `scripts/` directory no longer exists because its contents live under `tools/scripts/`.
- [ ] A repository-wide audit of `scripts/` references is completed and every remaining valid reference intentionally points to `tools/scripts/` or is updated for the new location.
- [ ] All current `package.json` command entrypoints that used `scripts/...` point to `tools/scripts/...`.
- [ ] `apps/desktop-tauri/project.json` uses the new `tools/scripts/...` path.
- [ ] `vitest.workspace.ts` includes tests from `tools/scripts/**/*.test.ts`.
- [ ] Documentation and workflow/config references that mention the moved paths are updated in the same pass.
- [ ] No code path changes beyond path relocation are introduced.

## 6. Open Questions

- None. All discovered repository references to `scripts/...`, including documentation, are in scope for this move.
