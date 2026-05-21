# Review Lifecycle

For any non-trivial task, the primary agent must use a second opinion before
moving forward. Non-trivial means anything beyond a typo, formatting-only tweak,
or a clearly mechanical one-line change.

The ideal review path:

1. The primary agent produces a plan, test strategy, or implementation.
2. The checkpoint is routed to the preferred reviewer for that stage.
3. The reviewer performs the checkpoint review using the matching reviewer
   agent or prompt.
4. The primary agent continues only after the review is addressed.

## Required Checkpoints

### Plan Review

Produce a spec or implementation plan, then send it to a second reviewer.

Primary: GitHub Copilot Claude Sonnet 4.6.
Fallback: `gemini-2.5-pro` through the Antigravity/Gemini compatibility
provider (or `pnpm review:plan:risky` to pin it).

**Codex plan mode**: before submitting the plan for review, invoke the
`grill-me` sub-agent to co-create and stress-test the plan. Do not proceed
to the Plan Review checkpoint until grill-me has no remaining
high-impact unresolved questions.

### Test Review

After writing tests but before using them as approval evidence, send the test
strategy and assertions to a second reviewer.

Primary: `pnpm review:test` (auto-routed).
Fallback: the matching tool-native reviewer subagent.

### Implementation Review

After the first working implementation and self-check are ready, send the
change to a second reviewer.

Primary: `pnpm review:implementation` (Antigravity/Gemini Flash reviewer via
`gemini-3-flash-preview`).
Fallback: Codex grill-me sub-agent.

**Sensitive changes** (auth, secrets, filesystem, shell execution, network
behavior, or public contracts): escalate directly to GitHub Copilot Claude
(`pnpm review:copilot`).

## Guardrails

- The primary agent must not self-approve its own plan, code, or tests.
- If a reviewer reports a high-risk issue, stop, fix it, and rerun the relevant
  checkpoint before continuing.
- Implementation review is mandatory when a task touches 3 or more files,
  changes data flow, updates permissions or auth, changes persistent state,
  modifies process lifecycle, touches filesystem/shell/network behavior,
  alters an external contract or public API, or changes review/governance
  surfaces.
- Pre-merge review must include the appropriate specialist reviewer for public
  APIs, auth, secrets, filesystem access, shell execution, or network behavior.
- `pre-merge` is an additional wrapper mode only. It does not replace the
  required `implementation` checkpoint or the pre-implementation gate.
- Before the first implementation change on a clean worktree, open the gate by
  running `pnpm review:approve-pre-implementation -- --reviewer <id> --focus
<area> --summary "<summary>"` after the plan review passes.
- Use `pnpm review:status` to inspect the gate and `pnpm review:reset` to clear
  it manually when needed.

## Checkpoint Commands

- `pnpm review:plan`: normal plan-review path.
- `pnpm review:plan:risky`: risky plan review pinned to Gemini Pro through
  the Antigravity/Gemini compatibility provider.
- `pnpm review:test`: normal test-review path.
- `pnpm review:implementation`: normal implementation-review auto-routing path.
- `pnpm review:copilot`: explicit Copilot escalation path (required for
  sensitive changes).
