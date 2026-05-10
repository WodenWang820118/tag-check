# Agent Workflow

This repository uses `AGENTS.md` as the single source of truth for agent behavior.
Project skills live in `.agents/skills`, reviewer personas live in `.agents/reviewers`, and tool-specific bridge files such as `.github/copilot-instructions.md` must defer to this file instead of redefining the workflow.

## Canonical Context

- Follow `AGENTS.md` first, then load the smallest relevant set of skills.
- The preferred review authority is GitHub Copilot running a Claude-family model for plan and test checkpoints. Use Gemini CLI as the default reviewer for non-low-risk implementation work, and allow Codex-first auto-routing only for deterministic low-risk `implementation` or `pre-merge` reviews where this file says so.
- Skill precedence is fixed:
  1. `AGENTS.md`
  2. local Nx and repo skills in `.agents/skills`
  3. reviewer personas in `.agents/reviewers`
  4. vendored general-purpose skills in `.agents/skills`
- Treat `.agents/skills` as the canonical skill directory for this repo.
- Do not recreate `.github/skills` or `.gemini/skills` copies unless a tool proves it cannot read `.agents/skills`.
- Use `using-agent-skills` to choose the smallest helpful workflow. For non-trivial work, the common path is `product-and-scope-review` when framing is unstable, then `spec-driven-development` -> `planning-and-task-breakdown` -> `incremental-implementation` -> `refactoring-and-simplification` (conditional; see Phase 3.5) -> `test-driven-development` -> `qa-verification` -> `code-review-and-quality` -> `release-readiness`, but load only the phases the task actually needs.
- `.agents/skills/authoring-guide.md` defines the repo-local rules for writing or slimming skills.
- A repo-level pre-implementation gate is enforced through `.github/hooks/review-gate.json`. On a clean worktree, Copilot will deny mutating tool calls until a plan review approval is recorded.
- `proofshot` is an optional repo-local verification helper for browser-verifiable UI work. It does not replace tests, and it does not participate in the pre-implementation gate.

## Behavioral Overlay

Adopt the following Karpathy-inspired behavioral overlay to improve agent precision and reliability inside the existing phased workflow:

- `Think Before Coding`: surface assumptions, present multiple plausible interpretations when ambiguity matters, and ask instead of silently choosing.
- `Simplicity First`: prefer the minimum code and process change that solves today's problem. Avoid speculative abstractions, configurability, or edge-case machinery that the request does not need.
- `Surgical Changes`: touch only the files and lines needed for the task. Clean up only the orphans created by the current change unless broader cleanup is explicitly requested.
- `Goal-Driven Execution`: turn vague tasks into explicit success criteria, verification steps, and checkpoints before declaring the work done.

These principles augment the repo's phase boundaries, review checkpoints, and gate rules. They do not replace the existing workflow.

## Task Sizing and Progressive Delivery

Every non-trivial plan must record `Task Size: <tiny|small|medium|large|huge>` with a short rationale once enough context is known. Classify by risk, verification boundary, rollback cost, and coordination needs first; file and project counts are heuristics, not permission to downgrade risk.

Size classes:

- `tiny`: typo, formatting-only, or a clearly mechanical one-line change. A second opinion is normally optional, but the agent should still request review when the impact is not fully understood, especially for workflow, configuration, generated, or governance files.
- `small`: 1-2 files in one project/module, one behavior, no public contract, data-flow, persistent-state, auth, process-lifecycle, shell/filesystem/network, or external-integration change.
- `medium`: 3-5 files or one project plus tests, with localized behavior or data-flow changes that remain reviewable and verifiable as one diff.
- `large`: 6-10 files, 2-3 projects/modules, multiple coordinated behaviors, or changes to public contracts, persistent state, permissions/auth, process lifecycle, shell/filesystem/network behavior, or external integrations that can still be reviewed as one coherent plan and diff.
- `huge`: more than 10 files, 4+ projects/modules, multiple independent behaviors, a phased rollout or migration need, an unclear verification boundary, or any task too risky or broad to review, verify, or rollback as one diff.

Escalate to the highest applicable class when signals conflict. Low file count never downgrades public-contract, security, persistent-state, process-lifecycle, external-integration, or governance risk. If scope grows during work, stop, update the task size and plan, and rerun the required review/gate steps before continuing.

Minimal verification is the smallest targeted check that can catch the likely failure mode introduced by the current change or phase. Record it before implementation starts. Prefer Nx project targets discovered through repo/Nx context, such as targeted tests, lint, build, or affected tasks for touched projects when appropriate. For docs or workflow-only changes, minimal verification can be diff/readthrough validation plus lightweight repo inspection; do not invent fake code tests. If no meaningful automated check exists, state that explicitly and use manual inspection plus review as evidence.

Huge tasks must include a reviewable sub-plan before implementation. The sub-plan must live in the plan context and should be saved to a repo spec/plan file when work spans multiple sessions, agents, or days. Use this phase schema:

```md
### Phase N: <name>

- Goal:
- Scope:
- Explicit non-goals:
- Expected files/projects:
- Dependencies/ordering:
- Minimal verification:
- Review checkpoint needs:
- Commit message:
- Rollback strategy:
- Exit criteria:
```

Progressive delivery rules for huge tasks:

- The full sub-plan must pass `Plan Review` before Phase 1 implementation, then the pre-implementation gate is opened for Phase 1.
- Implement exactly one approved phase at a time. Do not start mutating the next phase until the current phase meets its exit criteria.
- Before each phase commit, run the planned minimal verification, inspect `git status --short`, and ensure only phase-owned changes are included.
- If a phase independently triggers implementation review rules, run `Implementation Review` before committing that phase. Phase commits do not bypass `Test Review`, `Implementation Review`, `pre-merge`, or release-readiness requirements.
- After committing a phase, treat the next phase as a continuation checkpoint because the review gate is HEAD-bound. Confirm the worktree is clean, state the next phase goal, reference the approved sub-plan, record the completed phase commit hash, run `pnpm review:status`, and reopen the gate for the next phase with the same approved sub-plan and a continuation summary before mutating.
- If the next phase materially differs from the approved sub-plan, update the plan and rerun `Plan Review` before reopening the gate.

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
  3. **Task Size Gate:** Classify the task size once enough context is known. For non-trivial work, carry the classification and rationale into the selected planning workflow. Large or huge work normally routes to `spec-driven-development` or `planning-and-task-breakdown`, depending on whether a decision-ready spec already exists.
  4. **Clarification Budget:** After bounded discovery, ask at most 1 post-scan follow-up question if high-impact ambiguity remains. Together with the intent-gate question, the total clarification budget is 1 pre-scan question and 1 post-scan question. Budget exhaustion never authorizes proceeding through unresolved ambiguity that would change architecture, public contracts, security boundaries, persistent data, or require broad exploration.
  5. **Workflow Selection:** Choose 1 primary next skill for the planning or repo-workflow phase.

### Phase 2: Planning

- Load 1 primary planning skill at a time.
- Use `product-and-scope-review` first when the request is solution-framed, scope is unstable, or the real user outcome still needs to be clarified.
- For feature work, the usual progression is `spec-driven-development` then `planning-and-task-breakdown`.
- Every non-trivial spec or implementation plan must record task size, size rationale, minimal verification strategy, and review checkpoint needs.
- New or revised medium+ feature/spec plans must also record `Refactoring risk: <none|low|medium|high>` and `Preparatory refactor needed?: <yes|no>`. If risk is medium/high, plan a Refactor Checkpoint and verification target. If preparatory refactor is needed, load `refactoring-and-simplification` before feature implementation and keep that refactor behavior-preserving.
- Large plans must explain why the task can still be reviewed and verified as one coherent diff.
- Huge plans must include the sub-plan schema from `Task Sizing and Progressive Delivery`, including phase-level verification, review checkpoint needs, commit messages, rollback strategy, and exit criteria.
- Do not preload `incremental-implementation`, `test-driven-development`, `qa-verification`, or `code-review-and-quality` during planning.
- Every non-trivial spec or plan must pass the `Plan Review` checkpoint before implementation starts.

### Phase 3: Implementation

- Use `incremental-implementation` as the execution discipline for multi-file work.
- For huge tasks, implement one approved sub-plan phase at a time and stop at each phase boundary for minimal verification, required review checkpoints, git status inspection, and a phase commit before continuing.
- Reclassify and return to planning if implementation reveals materially larger scope, changed contracts, new persistence/security/process risk, or a phase that no longer matches the approved sub-plan.
- Load specialist skills on demand for the current slice, such as `frontend-ui-engineering`, `api-and-interface-design`, `security-and-hardening`, or repo-specific Nx skills.
- Load `.agents/stack-conventions.md` only when the task involves Angular, NestJS, or other stack-specific implementation details.
- Keep checkpoint and release-closeout skills unloaded until the work reaches their checkpoint.

### Phase 3.5: Refactor Checkpoint

- Load `.agents/skills/refactoring-and-simplification/SKILL.md` only after a completed implementation slice is verifiable and has passed its minimal check, or before feature implementation when the approved plan says `Preparatory refactor needed?: yes`.
- Assess triggers only at slice-completion boundaries, never mid-write. Tiny single-file or mechanical changes skip this checkpoint.
- Run the checkpoint only when the current change creates or worsens one of these conditions:
  - large-file pressure: a non-generated source file exceeds 500 lines after the slice and the slice added 50+ net lines to it, or an existing non-generated source file that had at least 50 lines before the slice receives 100+ net new lines
  - semantic duplication: the current change creates the third concrete copy of the same logic, state transition, validation, mapping, or UI/control pattern
  - mixed responsibility: a component, store, or service gains a second distinct responsibility because of the current change
  - hard-to-test logic: current-change logic is embedded in a UI, controller, or integration layer when an existing local pattern would place it in a service, helper, or store
  - current-change orphan code: a helper function, module, or exported symbol created by the current change is fully unused; incidental unused imports or locals are normal slice cleanup, not a Phase 3.5 trigger
- Behavior-preserving means existing relevant tests/checks still pass, interface signatures and external contracts are unchanged, data models and persistence behavior are unchanged, and the same minimal verification used before the refactor is rerun after the refactor.
- If a planned preparatory refactor touches 2 or fewer files and remains behavior-preserving, run planned verification and continue to feature implementation.
- If a planned preparatory refactor touches 3+ files or otherwise triggers implementation-review rules, run Implementation Review before feature implementation continues. If scope still matches the approved plan, do not run `pnpm review:reset`; after any preparatory-refactor commit, run `pnpm review:status`. If the HEAD-bound approval is no longer valid, reopen the gate with the same approved plan and a continuation summary before feature implementation continues.
- If preparatory or checkpoint refactor scope materially expands, changes contracts, or crosses security, persistence, process-lifecycle, shell, filesystem, network, or external-integration risk, stop, run `pnpm review:reset`, update the plan, rerun Plan Review, and reopen the pre-implementation gate before further mutation.
- Record a refactor ledger whenever a refactor is performed. Preferred location order is the existing repo-tracked plan/spec file, the commit message extended description when Phase 4 has not opened and no plan/spec exists, then the implementation review context or final handoff. If the checkpoint is considered but skipped, include a one-line rationale in the implementation review context or final handoff.

### Phase 4: Test, QA, and Review Checkpoints

- Load `.agents/skills/test-driven-development/SKILL.md` when drafting or updating tests for changed behavior.
- Load `.agents/skills/qa-verification/SKILL.md` when a completed change needs browser proof, smoke verification, report-only QA, or fix-enabled verification.
- Use `.agents/skills/proofshot/SKILL.md` only as a browser-only helper when `qa-verification` or the user request calls for proof artifacts.
- Load `.agents/skills/code-review-and-quality/SKILL.md` when preparing for or responding to implementation review.
- Load `.agents/skills/release-readiness/SKILL.md` when the work needs docs freshness, a final verification story, or a clean handoff summary.
- Load reviewer personas from `.agents/reviewers` only for the active checkpoint, adding specialist reviewers when a change crosses categories.

## Mandatory Review Lifecycle

For any non-trivial task, the primary agent must use a second opinion before moving forward. "Non-trivial" means anything beyond a typo, formatting-only tweak, or a clearly mechanical one-line change.

The ideal review path is:

1. plan or implementation is produced in the active tool
2. the checkpoint is routed to the preferred reviewer for that stage
3. the reviewer performs the checkpoint review using the matching reviewer agent or prompt
4. the primary tool continues only after the review is addressed

If the scripted Copilot Claude path is unavailable in the current environment, prefer Gemini CLI before Copilot GPT-5 mini where this file routes an automatic second reviewer, otherwise use the matching local reviewer persona or Codex reviewer subagent.

### Required checkpoints

1. `Plan review`: produce a spec or implementation plan, then send it to a second reviewer.
   Default: GitHub Copilot Claude Sonnet 4.6. If the normal Copilot Claude path is unavailable or quota exhausted, use `gemini-2.5-pro` before retrying with GitHub Copilot GPT-5 mini. If both local CLIs are unavailable, use the matching Codex reviewer subagent.
2. `Test review`: after writing tests but before running the broad sign-off suite or using those tests as approval evidence, send the test strategy and assertions to a second reviewer.
   Default: Use `gemini-2.5-pro` before retrying with GitHub Copilot GPT-5 mini. If both local CLIs are unavailable, use the matching local reviewer persona or Codex reviewer subagent instead of silently self-approving.
3. `Implementation review`: after the first working implementation, self-check, and reviewable verification story are ready, send the change to a second reviewer.
   Default: `pnpm review:implementation` keeps Gemini Flash Preview using the CLI model id `gemini-3-flash-preview` first for normal or sensitive implementation reviews. Its auto router may start with the matching Codex reviewer subagent only when the context contains an explicit small changed-file list, that list exactly matches the repo's current changed-file set, the scope is non-sensitive, and no review or governance surfaces are touched. Otherwise fall back in this order: GitHub Copilot GPT-5 mini, then the matching Codex reviewer subagent. Escalate to GitHub Copilot Claude when blocking findings remain or when the change touches auth, secrets, filesystem, shell execution, network behavior, or public contracts.

Load `.agents/references/proofshot-targets.md` for repo-specific browser proofshot routing detail.

### Guardrails

- The primary agent must not self-approve its own plan, code, or tests.
- If a reviewer reports a high-risk issue, stop, fix it, and re-run the relevant checkpoint before continuing.
- Implementation review is mandatory when a task touches 3 or more files, changes data flow, updates permissions or auth, changes persistent state, modifies process lifecycle, or alters an external contract.
- Pre-merge review must include the appropriate specialist reviewer for public APIs, auth, secrets, filesystem access, shell execution, or network behavior.
- `pre-merge` is an additional wrapper mode only. It does not replace the required `implementation` checkpoint or the pre-implementation gate.
- Before the first implementation change on a clean worktree, open the gate by running `pnpm review:approve-pre-implementation -- --reviewer <copilot-claude|copilot-gpt-5-mini|gemini-2.5-pro|codex-subagent> --focus <area> --summary "<approval summary>"` after the plan review passes.
- Use `pnpm review:status` to inspect the gate and `pnpm review:reset` to clear it manually when needed.

## Reviewer Routing

Use the reviewer personas in `.agents/reviewers` as the default second-opinion specialists.

- Planning, schemas, APIs, state machines, migrations, or cross-file design: `architecture-reviewer.md`
- Tests, bug fixes, regressions, assertions, and coverage: `test-reviewer.md`
- Auth, secrets, filesystem, shell, process execution, network, untrusted input, or data exposure: `security-reviewer.md`
- UI, UX flows, accessibility, copy, empty/loading/error states, and responsive behavior: `ux-reviewer.md`
- Standard Phase 3.5 refactor review and cross-cutting refactor escalation: `architecture-reviewer.md`

Use more than one reviewer if the task crosses categories.

## Repo-Specific Context

- Load `.agents/references/repo-map.md` when routing work, choosing reviewers, or discovering Nx targets.
- Load `.agents/references/proofshot-targets.md` only for browser-verifiable proofshot routing.
- Load `.agents/stack-conventions.md` only for Angular, NestJS, or other stack-specific implementation work.

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

Use `.agents/references/proofshot-targets.md` for repo-specific browser target routing.

## Tool-Specific Expectations

### GitHub Copilot

- `.github/copilot-instructions.md` is a bridge file. It must not override this workflow.
- Prefer project skills from `.agents/skills`.
- GitHub Copilot Claude Sonnet 4.6 is the preferred scripted reviewer for plan reviews, test reviews, and escalated implementation reviews.
- Before using Copilot CLI for a scripted checkpoint review, confirm the local CLI is installed and that a constant low-cost probe still succeeds. Treat a failed probe as unavailability and fall back instead of sending the full review payload.
- Copilot hooks in `.github/hooks/review-gate.json` are the hard guardrail for pre-implementation review on a clean worktree.
- When using Copilot CLI and Rubber Duck is available, prefer a Claude-family orchestrator and run `/experimental`.
- For plan, test, and non-low-risk implementation reviews, the auto-routed review wrappers should prefer Gemini CLI before Copilot GPT-5 mini. Low-risk `implementation` or `pre-merge` auto routing may try the matching Codex reviewer first when deterministic low-risk signals are present. Keep the Copilot-only retry path only when the review is explicitly pinned to `--provider copilot`.
- Trigger Rubber Duck critique after a plan is drafted, after an escalated multi-file implementation review, and after tests are written but before they are executed.
- If Rubber Duck is unavailable, use the matching reviewer agent in `.github/agents` as the required second opinion.
- If the user explicitly asks for a critique, review, second opinion, or Rubber Duck, force a second opinion even if the task is otherwise small.
- For browser-verifiable UI proof requests, use `qa-verification` and the repo-local `proofshot` workflow when browser artifacts are the right evidence path.

### Gemini CLI

- Keep using `.gemini/settings.json` with `contextFileName: "AGENTS.md"`.
- Use `gemini-2.5-pro` for risky pre-implementation plan reviews and when Copilot quota or availability prevents the normal Copilot plan review path.
- Use Gemini Flash Preview through the CLI model id `gemini-3-flash-preview` as the default implementation reviewer.
- Before using Gemini CLI for a scripted checkpoint review, confirm the local CLI is installed and that a constant low-cost probe succeeds for the intended model. If the probe fails, fall back instead of sending the full review payload.
- Apply adaptive throttling for scripted Gemini reviews: `gemini-2.5-pro` uses a 38s start-to-start target with `35s -> 50s -> 75s` retry backoff, and `gemini-3-flash-preview` uses a 22s start-to-start target with `20s -> 30s` retry backoff.
- Use `.agents/reviewers` as the source of reviewer personas and escalation lenses for Gemini-produced reviews.

### Codex CLI

- Keep using `.codex/config.toml` as the repo-local Codex config.
- Prefer running Codex in WSL for this repository when possible.
- For non-trivial work, use `pnpm review:plan`, `pnpm review:plan:risky`, `pnpm review:implementation`, and `pnpm review:test` to route checkpoint reviews through the repo-standard wrappers.
- Use the configured reviewer subagents for plan, implementation, test, and UX/security review checkpoints.
- Low-risk `implementation` and `pre-merge` auto routing may select Codex first only when the review context includes an explicit small non-sensitive changed-file list that exactly matches the repo's current changed-file set. Plan and test checkpoints remain Copilot-led unless fallback is required.
- When Copilot CLI or Gemini CLI is not locally usable, the review wrappers should fall back to the matching Codex reviewer subagent instead of silently self-approving.

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
