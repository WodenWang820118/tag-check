# Reviewer Routing

Use `.agents/reviewers` as the source of second-opinion specialist lenses.
Reviewer personas are checkpoint lenses, not general instruction replacements.

## Default Reviewer Lenses

- Planning, schemas, APIs, state machines, migrations, or cross-file design:
  `architecture-reviewer.md`
- Standard Phase 3.5 refactor review and cross-cutting refactor escalation:
  `architecture-reviewer.md`
- Tests, bug fixes, regressions, assertions, and coverage:
  `test-reviewer.md`
- Auth, secrets, filesystem, shell, process execution, network, untrusted input,
  or data exposure: `security-reviewer.md`
- UI, UX flows, accessibility, copy, empty/loading/error states, and responsive
  behavior: `ux-reviewer.md`

Use more than one reviewer if the task crosses categories.

## Routing Notes

- Reviewer personas apply after root `AGENTS.md`, referenced workflow files, and
  relevant skills.
- Do not let a reviewer persona weaken a root hard rule or required checkpoint.
- Escalate public APIs, auth, secrets, filesystem access, shell execution, or
  network behavior into pre-merge specialist review.
- For browser-verifiable UI proof requests, use `qa-verification` first. Load
  the proofshot workflow only when browser artifacts are the right evidence.
