# Agent Workflow

This repository uses `AGENTS.md` as the single source of truth for agent behavior.
Project skills live in `.agents/skills`, the shared review contract lives in `.agents/reviewers/common-review-contract.toml`, and tool-specific bridge files such as `.github/copilot-instructions.md` must defer to this file instead of redefining the workflow.

## Canonical Context

- Follow `AGENTS.md` first, then load the smallest relevant set of skills.
- The preferred review authority is GitHub Copilot running a Claude-family model for plan and test checkpoints. Use Antigravity CLI (`agy`) as the default reviewer for non-low-risk implementation work, and allow Codex-first auto-routing only for deterministic low-risk `implementation` or `pre-merge` reviews where this file says so.
- Skill precedence is fixed:
  1. `AGENTS.md`
  2. local Nx and repo skills in `.agents/skills`
  3. the shared review contract plus the active tool-native reviewer profile or prompt
  4. vendored general-purpose skills in `.agents/skills`
- Treat `.agents/skills` as the canonical skill directory for this repo.
- Do not recreate `.github/skills` or `.gemini/skills` copies unless a tool proves it cannot read `.agents/skills`.
- Use `using-agent-skills` to choose the smallest helpful workflow. For non-trivial work, the common path is `product-and-scope-review` when framing is unstable, then `spec-driven-development` -> `planning-and-task-breakdown` -> `incremental-implementation` -> `test-driven-development` -> `qa-verification` -> `code-review-and-quality` -> `release-readiness`, but load only the phases the task actually needs.
- `.agents/skills/authoring-guide.md` defines the repo-local rules for writing or slimming skills.
- A repo-level pre-implementation gate is enforced through `.github/hooks/review-gate.json`. On a clean worktree, Copilot will deny mutating tool calls until a plan review approval is recorded.
- `proofshot` is an optional repo-local verification helper for browser-verifiable UI work. It does not replace tests, and it does not participate in the pre-implementation gate.

## Phased Context Loading

The agent must operate in distinct phases, loading context incrementally. A later-phase skill is not part of entry context unless a repo rule explicitly requires it.

### Phase 1: Entry & Intent Discovery

- **Default context loaded:**
  1. `AGENTS.md` (this file)
  2. `.agents/skills/using-agent-skills/SKILL.md`
- **Repo-mandated exceptions:**
  - Load `nx-workspace` immediately for Nx exploration, target discovery, or workspace debugging.
  - Load `nx-generate` immediately for Nx scaffolding or setup work.
- **Workflow:**
  1. **Intent Gate:** If the prompt has 2 or more plausible high-impact interpretations, ask 1 decision question before repo exploration.
  2. **Bounded Discovery:** Otherwise, prefer repo truth over asking. Use at most 2 targeted commands or inspect at most 3 files to resolve discoverable facts.
  3. **Clarification Budget:** After bounded discovery, ask at most 1 follow-up question if high-impact ambiguity remains. Budget exhaustion never authorizes proceeding through unresolved ambiguity that would change architecture, public contracts, security boundaries, persistent data, or require broad exploration.
  4. **Workflow Selection:** Choose 1 primary next skill for the planning or repo-workflow phase.

### Phase 2: Planning

- Load 1 primary planning skill at a time.
- Use `product-and-scope-review` first when the request is solution-framed, scope is unstable, or the real user outcome still needs to be clarified.
- For feature work, the usual progression is `spec-driven-development` then `planning-and-task-breakdown`.
- Do not preload `incremental-implementation`, `test-driven-development`, `qa-verification`, or `code-review-and-quality` during planning.
- Every non-trivial spec or plan must pass the `Plan Review` checkpoint before implementation starts.

### Phase 3: Implementation

- Use `incremental-implementation` as the execution discipline for multi-file work.
- Load specialist skills on demand for the current slice, such as `frontend-ui-engineering`, `api-and-interface-design`, `security-and-hardening`, or repo-specific Nx skills.
- Load the matching file under `.agents/references/stack-conventions/` only when the task involves one of the repo's primary implementation stacks.
- Keep checkpoint and release-closeout skills unloaded until the work reaches their checkpoint.

### Phase 4: Test, QA, and Review Checkpoints

- Load `.agents/skills/test-driven-development/SKILL.md` when drafting or updating tests for changed behavior.
- Load `.agents/skills/qa-verification/SKILL.md` when a completed change needs browser proof, smoke verification, report-only QA, or fix-enabled verification.
- Use `.agents/skills/proofshot/SKILL.md` only as a browser-only helper when `qa-verification` or the user request calls for proof artifacts.
- Load `.agents/skills/code-review-and-quality/SKILL.md` when preparing for or responding to implementation review.
- Load `.agents/skills/release-readiness/SKILL.md` when the work needs docs freshness, a final verification story, or a clean handoff summary.
- Apply `.agents/reviewers/common-review-contract.toml` for every review checkpoint, then use the active tool-native reviewer profile or prompt for specialist coverage. Do not recreate or load legacy `.agents/reviewers/*-reviewer.md` personas.

## Mandatory Review Lifecycle

For any non-trivial task, the primary agent must use a second opinion before moving forward. "Non-trivial" means anything beyond a typo, formatting-only tweak, or a clearly mechanical one-line change.

The ideal review path is:

1. plan or implementation is produced in the active tool
2. the checkpoint is routed to the preferred reviewer for that stage
3. the reviewer performs the checkpoint review using the matching reviewer agent or prompt
4. the primary tool continues only after the review is addressed

If the scripted Copilot Claude path is unavailable in the current environment, prefer Antigravity CLI (`agy`) before the Codex grill-me sub-agent where this file routes an automatic second reviewer, otherwise use the matching tool-native reviewer profile, prompt, or Codex reviewer subagent.

### Required checkpoints

1. `Plan review`: produce a spec or implementation plan, then send it to a second reviewer.
   Default: GitHub Copilot Claude Sonnet 4.6. If the normal Copilot Claude path is unavailable or quota exhausted, use `gemini-3.5-flash-high` before falling back to the Codex grill-me sub-agent. In Codex plan mode, invoke the grill-me sub-agent first to co-create and stress-test the plan before submitting for Plan Review.
2. `Test review`: after writing tests but before running the broad sign-off suite or using those tests as approval evidence, send the test strategy and assertions to a second reviewer.
   Default: GitHub Copilot Claude Sonnet 4.6. If the normal Copilot Claude path is unavailable or quota exhausted, use `gemini-3.5-flash-high` before falling back to the Codex grill-me sub-agent instead of silently self-approving.
3. `Implementation review`: after the first working implementation, self-check, and reviewable verification story are ready, send the change to a second reviewer.
   Default: `pnpm review:implementation` keeps Antigravity CLI (`agy`) with the logical model id `gemini-3.5-flash-high` first for normal or sensitive implementation reviews. Its auto router may start with the matching Codex reviewer subagent only when the context contains an explicit small changed-file list, that list exactly matches the repo's current changed-file set, the scope is non-sensitive, and no review or governance surfaces are touched. Otherwise fall back in this order: GitHub Copilot Claude Sonnet 4.6, then the Codex grill-me sub-agent. Escalate to GitHub Copilot Claude when blocking findings remain or when the change touches auth, secrets, filesystem, shell execution, network behavior, or public contracts.

For browser-verifiable `ng-frontend` tasks, `proofshot` can be used after implementation and before final sign-off, typically through `qa-verification`, to generate screenshots, session video, and a local proof summary for human review.

### Guardrails

- The primary agent must not self-approve its own plan, code, or tests.
- If a reviewer reports a high-risk issue, stop, fix it, and re-run the relevant checkpoint before continuing.
- Implementation review is mandatory when a task touches 3 or more files, changes data flow, updates permissions or auth, changes persistent state, modifies process lifecycle, or alters an external contract.
- Pre-merge review must include the appropriate specialist reviewer for public APIs, auth, secrets, filesystem access, shell execution, or network behavior.
- `pre-merge` is an additional wrapper mode only. It does not replace the required `implementation` checkpoint or the pre-implementation gate.
- Before the first implementation change on a clean worktree, open the gate by running `pnpm review:approve-pre-implementation -- --reviewer <copilot-claude|gemini-3.5-flash-high|codex-subagent> --primary-family <copilot|gemini|codex> --task-size <tiny|small|medium|large|huge> --focus <area> --summary "<approval summary>"` after the plan review passes. The reviewer family must differ from `--primary-family`; same-family approvals require `--mode override --override-reason "<rationale>"`.
- Use `pnpm review:status` to inspect the gate and `pnpm review:reset` to clear it manually when needed.

### Cross-Family Grill-me Rule

Before submitting a plan to Plan Review, invoke the `grill-me` skill
(`.agents/skills/grill-me/SKILL.md`) when **any** of the following holds:

- task size in `{medium, large, huge}`
- `Refactoring risk` in `{medium, high}`
- the change touches a sensitive surface (auth, secrets, filesystem, shell,
  process execution, network, public contracts, persistent state, or
  governance/control-plane files)

The griller's AI family must differ from the primary agent's family. Three
families are recognized:

| Family  | Includes                                                                                             |
| ------- | ---------------------------------------------------------------------------------------------------- |
| Copilot | Copilot Claude, Copilot CLI GPT-_, `.github/agents/_`                                                |
| Gemini  | Antigravity CLI (`agy`) only, `gemini-3.5-flash-high`, `gemini-3.5-flash-high`, `.gemini/commands/*` |
| Codex   | Codex CLI, `.codex/agents/*`, Codex `grill-me` sub-agent                                             |

Grill exits only when all six items in the grill-me end checklist have
concrete answers and no `high-impact` open question remains. The reviewer at
the Plan Review checkpoint must refuse to sign if the grill summary is
missing or incomplete (see `must_refuse_when` in
`.agents/reviewers/common-review-contract.toml`).

`small` and `tiny` tasks may skip cross-family `grill-me` unless the user
explicitly asks for a critique.

Full lifecycle: `.agents/workflows/review-lifecycle.md`.
Reviewer routing matrix: `.agents/reviewers/routing-matrix.md`.

## Reviewer Routing

Use `.agents/reviewers/common-review-contract.toml` as the shared review contract. Use tool-native reviewer profiles or prompts as specialist lenses.

- Planning, schemas, APIs, state machines, migrations, or cross-file design: `architecture-reviewer`
- Tests, bug fixes, regressions, assertions, and coverage: `test-reviewer`
- Auth, secrets, filesystem, shell, process execution, network, untrusted input, or data exposure: `security-reviewer`
- UI, UX flows, accessibility, copy, empty/loading/error states, and responsive behavior: `ux-reviewer`

Use more than one reviewer if the task crosses categories.

## Visual Verification

Use `proofshot` only when the task is browser-verifiable and one of these is true:

- the user explicitly asks for `proofshot`
- the user asks for screenshots, video proof, browser proof, or visual proof
- `qa-verification` chooses the browser path because human-reviewable artifacts would materially reduce risk

Expected repo workflow:

1. `pnpm proofshot:check`
2. `pnpm proofshot:start:web -- --description "<flow>"`
3. drive the browser with `proofshot exec ...` or compatible browser commands
4. `pnpm proofshot:stop`
5. review local `proofshot-artifacts/` with GitHub Copilot Claude using the dedicated proofshot review prompt

`proofshot` is for `ng-frontend` UI flows only. Do not route backend-only, server-only, or non-browser library tasks through it.

## Sub-agent Delegation

Task size determines delegation. Classify with `.agents/workflows/task-sizing.md`
first, then apply the three-tier model below. Do not delegate blindly — size,
domain fit, and cross-cutting risk all matter. This governs delegation
strategy and sequencing, not whether delegation occurs. The
orchestrator-only rule below is not optional.

**The Main Thread is orchestrator-only for non-tiny domain tasks.**
It plans, gates, and integrates — it must not directly write or edit Angular
code unless a Tier 1 exception is explicitly recorded. Any direct
implementation outside those exceptions is a protocol violation.

### Tier 1: Main Agent Direct (tiny tasks)

**Rule**: the main agent executes directly. Do NOT delegate.

- `tiny` tasks: typo, formatting-only, mechanical one-line change.
- Non-domain tasks of any size that require whole-workspace understanding:
  workspace config (`nx.json`, `pnpm-workspace.yaml`), CI/CD, Docker/compose,
  root-level docs, workflow files, bridge files.
- Simple scoped reads (inspecting ≤2 files to answer a factual question).

**Rationale**: round-trip overhead exceeds work; no context-isolation benefit;
these tasks need the main agent's full workspace awareness.

### Tier 2: Domain Sub-agent (small–medium, single-domain)

**Rule**: delegate to the matching domain sub-agent. The Main Thread must not
write or edit domain files directly for non-tiny tasks.

| Task domain                                                              | Sub-agent          | When                             |
| ------------------------------------------------------------------------ | ------------------ | -------------------------------- |
| Angular (`apps/ng-frontend`, `apps/ng-tag-build`, `apps/ng-product-doc`) | `angular-frontend` | `small`–`medium`, single-project |

The NestJS backend (`apps/nest-backend`) falls under the unknown-domain
exception below for `small` tasks; the main agent handles it directly.

Each sub-agent operates in its own context window and returns only a summary.
The main agent reviews the summary for consistency before proceeding.
If a sub-agent invocation fails or returns an error, stop and surface the
failure to the user; do not fall back to direct implementation.

#### Read-only Exploration & Investigation

Use read-only sub-agents to protect the Main Thread context from code-heavy
exploration.

| Purpose                             | Sub-agent / role    | When to use                                                                                                                     |
| ----------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Initial broad codebase mapping      | `codebase-mapper`   | Before implementation when affected files, Nx project boundaries, or cross-project impact are unclear                           |
| Focused mid-task code investigation | `code-investigator` | During planning, implementation, debugging, or review when detailed code reading, call-chain tracing, or impact analysis needed |

**`codebase-mapper`**: Use before implementation when the Main Thread needs a
broad map of affected projects, files, symbols, dependency paths, and test
gaps. It must not edit files.

**`code-investigator`**: Use when the Main Thread needs focused code reading
during the task. It must not edit files, approve gates, or implement changes.

See `.agents/references/agent-roles.md` for the role → platform mapping for
both `codebase-mapper` and `code-investigator`.

#### Context Hygiene Rule

The Main Thread must not perform deep read-heavy exploration itself when the
question can be delegated to `codebase-mapper` or `code-investigator`.

For non-trivial tasks, if the Main Thread needs to inspect more than roughly
three implementation files just to understand the code path, it must delegate
that investigation first and continue orchestration from the returned summary.

**Special case — unknown domain (exception to orchestrator-only rule)**: if a
`small` task doesn't clearly belong to a domain sub-agent (e.g., NestJS
backend, shared utilities, workspace tool scripts), the main agent handles it
directly. Do not force-fit into a domain sub-agent.

### Tier 3: Main Agent Orchestrates (large+, cross-cutting)

**Rule**: the main agent plans and coordinates; sub-agents execute isolated
slices.

- `large` or `huge` tasks: break into phases per
  `.agents/workflows/phased-workflow.md`.
- Cross-project changes: the main agent delegates each project's slice to its
  domain sub-agent in sequence or parallel, then integrates.
- Any task touching 2+ technology stacks: each stack gets its own sub-agent.

The main agent owns the plan, phase gating, integration verification, and final
handoff. Sub-agents own focused implementation within their slice.

### Review Sub-agents (always via main agent)

Review checkpoints delegate to `architecture-reviewer`, `test-reviewer`,
`security-reviewer`, or `ux-reviewer` as specified by
`.agents/workflows/review-lifecycle.md`. The main agent must never self-approve
its own plan, code, or tests — always use a second reviewer for non-trivial
work.

## Tool-Specific Expectations

### GitHub Copilot

- `.github/copilot-instructions.md` is a bridge file. It must not override this workflow.
- Prefer project skills from `.agents/skills`.
- GitHub Copilot Claude Sonnet 4.6 is the preferred scripted reviewer for plan reviews, test reviews, and escalated implementation reviews.
- Before using Copilot CLI for a scripted checkpoint review, confirm the local CLI is installed and that a constant low-cost probe still succeeds. Treat a failed probe as unavailability and fall back instead of sending the full review payload.
- Copilot hooks in `.github/hooks/review-gate.json` are the hard guardrail for pre-implementation review on a clean worktree.
- When using Copilot CLI and Rubber Duck is available, prefer a Claude-family orchestrator and enable `/experimental`.
- For plan, test, and non-low-risk implementation reviews, the auto-routed review wrappers should prefer Antigravity CLI (`agy`) before Copilot GPT-5 mini. Low-risk `implementation` or `pre-merge` auto routing may try the matching Codex reviewer first only when the review context includes an explicit small non-sensitive changed-file list that exactly matches the repo's current changed-file set. Keep the Copilot-only retry path only when the review is explicitly pinned to `--provider copilot`.
- Trigger Rubber Duck critique after a plan is drafted, after an escalated multi-file implementation review, and after tests are written but before they are executed.
- If Rubber Duck is unavailable, use the matching reviewer agent in `.github/agents` as the required second opinion.
- If the user explicitly asks for a critique, review, second opinion, or Rubber Duck, force a second opinion even if the task is otherwise small.
- For browser-verifiable UI proof requests, use `qa-verification` and the repo-local `proofshot` workflow when browser artifacts are the right evidence path.

### Antigravity CLI (`agy`)

- Keep `.gemini/settings.json` context loading ordered with `AGENTS.md` first. Tool-specific bridges such as `GEMINI.md` may load after it only when they stay thin and defer back to `AGENTS.md`.
- Use `gemini-3.5-flash-high` for risky pre-implementation plan reviews and when Copilot quota or availability prevents the normal Copilot plan review path.
- Use Antigravity CLI (`agy`) through the logical model id `gemini-3.5-flash-high` as the default implementation reviewer.
- Before using Antigravity CLI for a scripted checkpoint review, confirm the local CLI is installed and that a constant low-cost probe succeeds for the intended model. If the probe fails, fall back instead of sending the full review payload.
- Apply adaptive throttling for scripted Antigravity reviews: `gemini-3.5-flash-high` uses a 38s start-to-start target with `35s -> 50s -> 75s` retry backoff, and `gemini-3.5-flash-high` uses a 22s start-to-start target with `20s -> 30s` retry backoff.
- Apply `.agents/reviewers/common-review-contract.toml` as the shared review contract and use `.gemini/commands/review/*.toml` as Gemini-specific specialist lenses. Do not recreate or load legacy `.agents/reviewers/*-reviewer.md` personas.

### Codex CLI

- Keep using `.codex/config.toml` as the repo-local Codex config.
- Prefer running Codex in WSL for this repository when possible.
- For non-trivial work, use `pnpm review:plan`, `pnpm review:plan:risky`, `pnpm review:implementation`, and `pnpm review:test` to route checkpoint reviews through the repo-standard wrappers.
- Use the configured reviewer subagents for plan, implementation, test, and UX/security review checkpoints.
- Low-risk `implementation` and `pre-merge` auto routing may select Codex first only when the review context includes an explicit small non-sensitive changed-file list that exactly matches the repo's current changed-file set. Plan and test checkpoints remain Copilot-led unless fallback is required.
- When Copilot CLI or Antigravity CLI is not locally usable, the review wrappers should fall back to the matching Codex reviewer subagent instead of silently self-approving.

## Repo Map

- `apps/ng-frontend`: Angular frontend application
- `apps/nest-backend`: NestJS backend service
- `apps/desktop-tauri`: Tauri desktop shell
- `apps/ng-frontend-e2e`: Playwright e2e tests

Use repo-specific reviewers and skills with that topology in mind.

## Stack Conventions

- For Angular and NestJS work, load the matching file under `.agents/references/stack-conventions/` after reading `AGENTS.md`.
- Keep bridge files thin. They may point to the stack convention directory, but they must not duplicate the full conventions body.
- Angular guidance should reflect standalone components, DI-first, `inject()`, and signal-first patterns.
- NestJS guidance should reflect DI-first architecture with thin controllers and service-led orchestration.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
