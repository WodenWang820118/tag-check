# Task Sizing and Progressive Delivery

Every non-trivial plan must record `Task Size:
<tiny|small|medium|large|huge>` with a short rationale once enough context is
known. Classify by risk, verification boundary, rollback cost, and coordination
needs first; file and project counts are heuristics, not permission to
downgrade risk.

## Size Classes

- `tiny`: typo, formatting-only, or a clearly mechanical one-line change. A
  second opinion is normally optional, but request review when impact is not
  fully understood, especially for workflow, configuration, generated, or
  governance files.
- `small`: 1-2 files in one project/module, one behavior, no public contract,
  data-flow, persistent-state, auth, process-lifecycle,
  shell/filesystem/network, external-integration, or governance change.
- `medium`: 3-5 files or one project plus tests, with localized behavior or
  data-flow changes that remain reviewable and verifiable as one diff.
- `large`: 6-10 files, 2-3 projects/modules, multiple coordinated behaviors, or
  changes to public contracts, persistent state, permissions/auth, process
  lifecycle, shell/filesystem/network behavior, external integrations, or
  governance/control-plane surfaces that can still be reviewed as one coherent
  plan and diff.
- `huge`: more than 10 files, 4+ projects/modules, multiple independent
  behaviors, a phased rollout or migration need, an unclear verification
  boundary, or any task too risky or broad to review, verify, or rollback as one
  diff.

Escalate to the highest applicable class when signals conflict. Low file count
never downgrades public-contract, security, persistent-state,
process-lifecycle, external-integration, or governance risk. If scope grows
during work, stop, update the task size and plan, and rerun the required
review/gate steps before continuing.

## Minimal Verification

Minimal verification is the smallest targeted check that can catch the likely
failure mode introduced by the current change or phase. Record it before
implementation starts.

Prefer Nx project targets discovered through repo/Nx context, such as targeted
tests, lint, build, or affected tasks for touched projects when appropriate. For
docs or workflow-only changes, minimal verification can be diff/readthrough
validation plus lightweight repo inspection; do not invent fake code tests. If
no meaningful automated check exists, state that explicitly and use manual
inspection plus review as evidence.

## Huge Task Phase Schema

Huge tasks must include a reviewable sub-plan before implementation. The
sub-plan must live in the plan context and should be saved to a repo spec/plan
file when work spans multiple sessions, agents, or days.

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

## Progressive Delivery Rules

- The full sub-plan must pass `Plan Review` before Phase 1 implementation, then
  the pre-implementation gate is opened for Phase 1.
- Implement exactly one approved phase at a time. Do not start mutating the next
  phase until the current phase meets its exit criteria.
- Before each phase commit, run the planned minimal verification, inspect
  `git status --short`, and ensure only phase-owned changes are included.
- If a phase independently triggers implementation review rules, run
  `Implementation Review` before committing that phase. Phase commits do not
  bypass `Test Review`, `Implementation Review`, `pre-merge`, or
  release-readiness requirements.
- After committing a phase, treat the next phase as a continuation checkpoint
  because the review gate is HEAD-bound. Confirm the worktree is clean, state
  the next phase goal, reference the approved sub-plan, record the completed
  phase commit hash, run `pnpm review:status`, and reopen the gate for the next
  phase with the same approved sub-plan and a continuation summary before
  mutating.
- If the next phase materially differs from the approved sub-plan, update the
  plan and rerun `Plan Review` before reopening the gate.
