# Proofshot Workflow

Use `proofshot` only when the task is browser-verifiable and one of these is
true:

- the user explicitly asks for `proofshot`
- the user asks for screenshots, video proof, browser proof, or visual proof
- `qa-verification` chooses the browser path because human-reviewable artifacts
  would materially reduce risk

Proofshot is an optional repo-local verification helper for browser-verifiable
UI work. It does not replace tests and does not participate in the
pre-implementation gate.

## Expected Workflow

1. `pnpm proofshot:check`
2. `pnpm proofshot:start:web -- --description "<flow>"`
3. Drive the browser with `proofshot exec ...` or compatible browser commands.
4. `pnpm proofshot:stop`
5. Review local `proofshot-artifacts/` with GitHub Copilot Claude using the
   dedicated proofshot review prompt.

Use `.agents/references/proofshot-targets.md` for repo-specific browser target
routing.
