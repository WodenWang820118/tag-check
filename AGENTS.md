# Agent Workflow

`AGENTS.md` is the repository-level entry point for coding agents.
Tool-specific bridge files must defer to this file instead of redefining the
workflow.

Detailed workflow files under `.agents/workflows/` are authoritative when this
file explicitly references them. If a root summary and a referenced workflow
detail conflict, follow the root for entry/gating requirements and the
referenced workflow file for its named phase or checkpoint.

## Repository Instruction Map

Use `.agents/workflows/` for control-plane rules, `.agents/skills/` for task
capabilities, `.agents/reviewers/common-review-contract.toml` for the shared
review contract, and `.agents/references/` for stable repo facts. Tool bridges
such as `.github/copilot-instructions.md`, `.gemini/settings.json`, and
`.codex/config.toml` point back here.

Instruction precedence:

1. Root hard rules in `AGENTS.md`.
2. Details in workflow files explicitly referenced by `AGENTS.md`.
3. Local repo and Nx skills in `.agents/skills`.
4. The shared review contract plus the active tool-native reviewer profile or
   prompt for the checkpoint.
5. Vendored or plugin-provided general-purpose skills.

Context loading order: read this file, read
`.agents/skills/using-agent-skills/SKILL.md`, load the workflow file required
by the current phase/checkpoint, then load only the smallest relevant skill and,
for review checkpoints, the shared contract plus the active tool-native
reviewer profile or prompt.

Do not recreate `.github/skills` or `.gemini/skills` copies unless a tool proves
it cannot read `.agents/skills`.

## Workflow Loading Triggers

- Load `.agents/workflows/task-sizing.md` when classifying non-trivial work,
  when scope changes, or when large/huge progressive delivery may apply.
- Load `.agents/workflows/phased-workflow.md` before planning non-trivial work
  and before implementation, refactor, test, QA, or release phases.
- Load `.agents/workflows/review-lifecycle.md` before any plan, test,
  implementation, or pre-merge checkpoint.
- Load `.agents/workflows/reviewer-routing.md` when selecting reviewers or
  specialist lenses.
- Load `.agents/workflows/proofshot.md` only for browser-verifiable proof,
  screenshots, video proof, or explicit `proofshot` requests.
- Load `.agents/workflows/tool-routing.md` when using or updating
  Copilot/Gemini/Codex review paths or bridge files.
- Load `.agents/references/memory-practices.md` at phase boundaries during
  large or huge tasks, before writing a session memory summary.

Adding a new workflow file requires a matching load trigger in this file.

## Behavioral Overlay

- `Think Before Coding`: surface assumptions, present plausible
  interpretations when ambiguity matters, and ask instead of silently choosing.
- `Simplicity First`: prefer the minimum code and process change that solves
  today's problem. Avoid speculative abstractions.
- `Surgical Changes`: touch only the files and lines needed for the task.
- `Goal-Driven Execution`: define success criteria, verification steps, and
  checkpoints before declaring the work done.

These principles augment the phased workflow and review checkpoints. They do
not replace them.

## Non-Trivial Work Rule

For anything beyond a typo, formatting-only tweak, or clearly mechanical
one-line edit:

- classify `Task Size: <tiny|small|medium|large|huge>` with rationale
- produce a plan and define minimal verification before implementation
- pass plan review and open the pre-implementation gate before mutating a clean
  worktree
- use incremental implementation for multi-file work
- run targeted verification
- pass every required review checkpoint before handoff

The primary agent must not self-approve its own plan, code, or tests.

Pre-implementation gate commands: inspect with `pnpm review:status`, approve
with `pnpm review:approve-pre-implementation -- --reviewer <id> --focus <area>
--summary "<summary>"`, and reset with `pnpm review:reset`.

## Task Size Summary

- `tiny`: typo, formatting-only, or mechanical one-line change.
- `small`: 1-2 files in one module, one localized behavior, and no contract,
  data-flow, persistence, auth, process, shell/filesystem/network, external
  integration, or governance risk.
- `medium`: 3-5 files or one project plus tests, localized behavior or
  data-flow changes that remain reviewable as one diff.
- `large`: 6-10 files, 2-3 projects/modules, coordinated behaviors, or
  contract, persistence, permissions/auth, process, shell/filesystem/network,
  external-integration, or governance/control-plane changes.
- `huge`: more than 10 files, 4+ projects/modules, multiple independent
  behaviors, migration/phased rollout need, unclear verification boundary, or
  anything too risky to review, verify, or rollback as one diff.

Escalate to the highest applicable class when signals conflict. Low file count
never downgrades public-contract, security, persistent-state,
process-lifecycle, external-integration, or governance risk.

Full rules: `.agents/workflows/task-sizing.md`.

## Required Reviews

- `Plan review`: required for every non-trivial plan before implementation.
- `Test review`: required after writing tests and before relying on those tests
  as approval evidence.
- `Implementation review`: mandatory for 3+ files, data-flow changes,
  auth/permissions, persistence, process lifecycle, filesystem/shell/network,
  external or public contracts, or review/governance surfaces.
- `pre-merge`: additional wrapper only; it does not replace implementation
  review or the pre-implementation gate.

Use `pnpm review:plan`, `pnpm review:test`, and
`pnpm review:implementation` unless the detailed workflow says a pinned
provider is required.

First-load routing rules that must stay inline:

- Plan reviews prefer GitHub Copilot Claude Sonnet 4.6; fall back through the
  repo wrapper path when unavailable. In Codex plan mode, invoke the
  `grill-me` sub-agent first to co-create and stress-test the plan before
  submitting it for Plan Review.
- Implementation reviews normally start with Gemini Flash Preview
  `gemini-3-flash-preview`.
- Codex-first implementation or pre-merge routing is allowed only with an
  explicit small non-sensitive changed-file list that exactly matches the repo's
  current changed-file set and touches no review/governance, auth, secrets,
  filesystem, shell, network, or public-contract surface.
- Escalate blocking findings, auth, secrets, filesystem, shell execution,
  network behavior, or public contracts to Copilot Claude.
- Gemini scripted review throttling is `gemini-2.5-pro`: 38s start-to-start
  with `35s -> 50s -> 75s` retry backoff; `gemini-3-flash-preview`: 22s
  start-to-start with `20s -> 30s` retry backoff.

Full lifecycle: `.agents/workflows/review-lifecycle.md`.
Tool details: `.agents/workflows/tool-routing.md`.

## Sub-agent Delegation

Use sub-agents for context isolation when a task touches multiple technology
stacks, crosses project boundaries, or benefits from a fresh context window.

- **Domain-specific implementation**: delegate Angular work to
  `angular-frontend`, Spring Boot work to `spring-boot-backend`, and FastAPI
  work to `fastapi-service`. Each sub-agent operates in its own context window
  and returns only a summary.
- **Cross-service contract validation**: delegate contract verification to
  `contract-validator` when modifying files in `contracts/`.
- **Codebase exploration**: delegate read-only scoping to `codebase-mapper`
  before multi-file changes.
- **Review checkpoints**: delegate to `architecture-reviewer`,
  `test-reviewer`, `security-reviewer`, or `ux-reviewer` as specified by the
  review lifecycle.

The main agent stays responsible for workflow orchestration, plan review,
coordination, and final verification. Sub-agents handle focused execution.

## Phase Safeguards

Use `product-and-scope-review` when scope is unstable. Feature work usually
flows through `spec-driven-development`, `planning-and-task-breakdown`, then
`incremental-implementation`. New or revised medium+ plans record `Refactoring
risk: <none|low|medium|high>` and `Preparatory refactor needed?: <yes|no>`.
Load `refactoring-and-simplification` only at approved refactor checkpoints or
after a completed implementation slice is verified.

Phase 3.5 refactor triggers that must stay inline:

- large-file pressure: non-generated source exceeds 500 lines and the slice
  added 50+ net lines, or an existing 50+ line source receives 100+ net lines
- semantic duplication: the current change creates the third concrete copy of
  the same logic or control pattern
- mixed responsibility: a component, store, or service gains a second distinct
  responsibility
- hard-to-test logic: logic is embedded in UI/controller/integration when local
  patterns would place it in a service, helper, or store
- current-change orphan code: a helper/module/export created by this change is
  fully unused

Full phase rules: `.agents/workflows/phased-workflow.md`.

## Repo-Specific Context

- Repo topology: `.agents/references/repo-map.md`.
- Browser proofshot targets: `.agents/references/proofshot-targets.md`.
- Memory practices for context window management:
  `.agents/references/memory-practices.md`.
- Stack conventions for Angular, NestJS, or Tauri:
  `.agents/stack-conventions.md`.

## Nx Rules

- Prefer `pnpm nx ...` and Nx targets over underlying tools.
- Load `nx-workspace` before Nx exploration, target discovery, or workspace
  debugging.
- Load `nx-generate` before scaffolding, setup, or generator work.
- Do not guess unfamiliar Nx flags; check Nx docs or `--help`.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->
