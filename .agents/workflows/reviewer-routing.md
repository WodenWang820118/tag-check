# Reviewer Routing

Use `.agents/reviewers/common-review-contract.toml` as the shared review
contract for every checkpoint. Shared reviewer profiles live in
`.agents/reviewers/<lens>-reviewer.md` and are the canonical source for
role-specific checks (Focus, Guardrails, Additional checks). Tool-native bridge
files load the shared profiles:

- Codex: `.codex/agents/*.toml` → loads `.agents/reviewers/<lens>-reviewer.md`
- GitHub Copilot: `.github/agents/*.agent.md` → loads `.agents/reviewers/<lens>-reviewer.md`
- Gemini: `.gemini/commands/review/*.toml` → loads `.agents/reviewers/<lens>-reviewer.md`

Do not duplicate reviewer-specific Focus, Guardrails, or Additional checks into
bridge files. Edit the shared profile instead.

## Default Reviewer Lenses

- Planning, schemas, APIs, state machines, migrations, or cross-file design:
  `architecture-reviewer`
- Standard Phase 3.5 refactor review and cross-cutting refactor escalation:
  `architecture-reviewer`
- Tests, bug fixes, regressions, assertions, and coverage:
  `test-reviewer`
- Auth, secrets, filesystem, shell, process execution, network, untrusted input,
  or data exposure: `security-reviewer`
- UI, UX flows, accessibility, copy, empty/loading/error states, and responsive
  behavior: `ux-reviewer`

Use more than one reviewer if the task crosses categories.

## Routing Notes

- Reviewer profiles and prompts apply after root `AGENTS.md`, referenced
  workflow files, relevant skills, and the shared review contract.
- Do not let a reviewer profile or prompt weaken a root hard rule or required
  checkpoint.
- Escalate public APIs, auth, secrets, filesystem access, shell execution, or
  network behavior into pre-merge specialist review.
- For browser-verifiable UI proof requests, use `qa-verification` first. Load
  the proofshot workflow only when browser artifacts are the right evidence.

## Pre-Implementation Exploration (Codex)

Before implementation begins on non-trivial tasks, the Codex `codebase-mapper`
agent (`.codex/agents/codebase-mapper.toml`) can map affected files, symbols,
Nx project boundaries, and high-risk coupling. Use it when the task scope is
unclear, the diff touches 3+ files, or inter-project dependencies need
confirming. `codebase-mapper` is read-only and does not replace `Plan Review`.
