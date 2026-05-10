# Copilot Bridge Instructions

`AGENTS.md` is the canonical repository instruction file. Follow it first, then
load the workflow file it names for the active phase or checkpoint.

Minimum first-read rules for Copilot sessions:

- For Angular, NestJS, and Tauri tasks, use .agents/stack-conventions.md via AGENTS.md.

- Project skills live in `.agents/skills`; reviewer personas live in
  `.agents/reviewers`; workflow rules live in `.agents/workflows`.
- For non-trivial work, produce a plan, pass plan review, open the
  pre-implementation gate, implement incrementally, run targeted verification,
  and pass required review checkpoints before handoff.
- Use `pnpm review:plan`, `pnpm review:test`, and
  `pnpm review:implementation` for normal checkpoint routing.
- Open the gate only after plan review with
  `pnpm review:approve-pre-implementation -- --reviewer <id> --focus <area> --summary "<summary>"`.
- GitHub Copilot Claude Sonnet 4.6 remains the preferred scripted reviewer for
  plan reviews, test reviews, and escalated implementation reviews.
- Implementation reviews normally start through the repo wrapper's Gemini Flash
  path. Codex-first low-risk routing is allowed only when an explicit small
  non-sensitive changed-file list exactly matches the repo's current changed
  files and no review/governance, auth, secrets, filesystem, shell, network, or
  public-contract surface is touched.
- When using Copilot CLI and Rubber Duck is available, prefer a Claude-family
  orchestrator and enable `/experimental`.
- Force Rubber Duck or another second opinion after a drafted plan, after an
  escalated multi-file implementation review, and after tests are written but
  before they are executed.
- If the user asks for `critique`, `review`, `second opinion`, or `rubber duck`,
  always trigger a second-opinion pass.
- For browser-verifiable proof requests, use `qa-verification`; when artifacts
  are needed, follow `.agents/workflows/proofshot.md`.
- Run workspace tasks through `pnpm nx ...`; load `nx-workspace` for Nx
  exploration and `nx-generate` for scaffolding.

Do not redefine provider routing, phase rules, or gate conditions here. Update
`AGENTS.md` and the referenced workflow files instead.
