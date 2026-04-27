# Phased Workflow

Agents operate in distinct phases and load context incrementally. A later-phase
skill is not part of entry context unless a repo rule explicitly requires it.

## Phase 1: Entry and Intent Discovery

Default context:

1. `AGENTS.md`.
2. `.agents/skills/using-agent-skills/SKILL.md`.

Repo-mandated exceptions:

- Load `nx-workspace` immediately for Nx exploration, target discovery, or
  workspace debugging.
- Load `nx-generate` immediately for Nx scaffolding or setup work.

Workflow:

1. `Intent Gate`: if the prompt has 2 or more plausible high-impact
   interpretations, ask 1 decision question before repo exploration.
2. `Bounded Discovery`: otherwise, prefer repo truth over asking. Use at most 2
   targeted commands or inspect at most 3 files to resolve discoverable facts.
3. `Task Size Gate`: classify the task size once enough context is known. For
   non-trivial work, carry the classification and rationale into planning.
4. `Clarification Budget`: after bounded discovery, ask at most 1 post-scan
   follow-up question if high-impact ambiguity remains. Together with the intent
   gate question, the total budget is 1 pre-scan question and 1 post-scan
   question.
5. `Workflow Selection`: choose 1 primary next skill for the planning or
   repo-workflow phase.

Budget exhaustion never authorizes proceeding through unresolved ambiguity that
would change architecture, public contracts, security boundaries, persistent
data, or require broad exploration.

## Phase 2: Planning

- Load 1 primary planning skill at a time.
- Use `product-and-scope-review` first when the request is solution-framed,
  scope is unstable, or the real user outcome still needs clarification.
- For feature work, the usual progression is `spec-driven-development`, then
  `planning-and-task-breakdown`.
- Every non-trivial spec or implementation plan must record task size, size
  rationale, minimal verification strategy, and review checkpoint needs.
- New or revised medium+ feature/spec plans must also record `Refactoring risk:
<none|low|medium|high>` and `Preparatory refactor needed?: <yes|no>`.
- If refactoring risk is medium/high, plan a refactor checkpoint and
  verification target. If preparatory refactor is needed, load
  `refactoring-and-simplification` before feature implementation and keep that
  refactor behavior-preserving.
- Large plans must explain why the task can still be reviewed and verified as
  one coherent diff.
- Huge plans must include the phase schema from
  `.agents/workflows/task-sizing.md`.
- Do not preload `incremental-implementation`, `test-driven-development`,
  `qa-verification`, or `code-review-and-quality` during planning.
- Every non-trivial spec or plan must pass `Plan Review` before implementation
  starts.

## Phase 3: Implementation

- Use `incremental-implementation` as the execution discipline for multi-file
  work.
- For huge tasks, implement one approved sub-plan phase at a time and stop at
  each phase boundary for minimal verification, required review checkpoints,
  git status inspection, and a phase commit before continuing.
- Reclassify and return to planning if implementation reveals materially larger
  scope, changed contracts, new persistence/security/process risk, or a phase
  that no longer matches the approved sub-plan.
- Load specialist skills on demand for the current slice, such as
  `frontend-ui-engineering`, `api-and-interface-design`,
  `security-and-hardening`, or repo-specific Nx skills.
- Load the matching file under `.agents/references/stack-conventions/` only
  when the task involves Angular, NestJS, Java, or Python.
- Keep checkpoint and release-closeout skills unloaded until the work reaches
  their checkpoint.

## Phase 3.5: Refactor Checkpoint

Load `.agents/skills/refactoring-and-simplification/SKILL.md` only after a
completed implementation slice is verifiable and has passed its minimal check,
or before feature implementation when the approved plan says `Preparatory
refactor needed?: yes`.

Assess triggers only at slice-completion boundaries, never mid-write. Tiny
single-file or mechanical changes skip this checkpoint.

Run the checkpoint only when the current change creates or worsens one of these
conditions:

- large-file pressure: a non-generated source file exceeds 500 lines after the
  slice and the slice added 50+ net lines to it, or an existing non-generated
  source file that had at least 50 lines before the slice receives 100+ net new
  lines
- semantic duplication: the current change creates the third concrete copy of
  the same logic, state transition, validation, mapping, or UI/control pattern
- mixed responsibility: a component, store, or service gains a second distinct
  responsibility because of the current change
- hard-to-test logic: current-change logic is embedded in a UI, controller, or
  integration layer when an existing local pattern would place it in a service,
  helper, or store
- current-change orphan code: a helper function, module, or exported symbol
  created by the current change is fully unused; incidental unused imports or
  locals are normal slice cleanup, not a Phase 3.5 trigger

Behavior-preserving means existing relevant tests/checks still pass, interface
signatures and external contracts are unchanged, data models and persistence
behavior are unchanged, and the same minimal verification used before the
refactor is rerun after the refactor.

If a planned preparatory refactor touches 2 or fewer files and remains
behavior-preserving, run planned verification and continue to feature
implementation.

If a planned preparatory refactor touches 3+ files or otherwise triggers
implementation-review rules, run `Implementation Review` before feature
implementation continues. If scope still matches the approved plan, do not run
`pnpm review:reset`; after any preparatory-refactor commit, run
`pnpm review:status`. If the HEAD-bound approval is no longer valid, reopen the
gate with the same approved plan and a continuation summary before feature
implementation continues.

If preparatory or checkpoint refactor scope materially expands, changes
contracts, or crosses security, persistence, process-lifecycle, shell,
filesystem, network, or external-integration risk, stop, run
`pnpm review:reset`, update the plan, rerun `Plan Review`, and reopen the
pre-implementation gate before further mutation.

Record a refactor ledger whenever a refactor is performed. Preferred location
order is the existing repo-tracked plan/spec file, the commit message extended
description when Phase 4 has not opened and no plan/spec exists, then the
implementation review context or final handoff. If the checkpoint is considered
but skipped, include a one-line rationale in the implementation review context
or final handoff.

## Phase 4: Test, QA, and Review Checkpoints

- Load `.agents/skills/test-driven-development/SKILL.md` when drafting or
  updating tests for changed behavior.
- Load `.agents/skills/qa-verification/SKILL.md` when a completed change needs
  browser proof, smoke verification, report-only QA, or fix-enabled
  verification.
- Use `.agents/skills/proofshot/SKILL.md` only as a browser-only helper when
  `qa-verification` or the user request calls for proof artifacts.
- Load `.agents/skills/code-review-and-quality/SKILL.md` when preparing for or
  responding to implementation review.
- Load `.agents/skills/release-readiness/SKILL.md` when the work needs docs
  freshness, a final verification story, or a clean handoff summary.
- Apply `.agents/reviewers/common-review-contract.toml` for every review
  checkpoint, then use the active tool-native reviewer profile or prompt for
  specialist coverage. Do not recreate or load legacy
  `.agents/reviewers/*-reviewer.md` personas.
