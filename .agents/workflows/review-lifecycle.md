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

If the scripted Copilot Claude path is unavailable, prefer Gemini CLI before
Copilot GPT-5 mini where this workflow routes an automatic second reviewer.
Otherwise use the matching tool-native reviewer profile, prompt, or Codex
reviewer subagent.

## Required Checkpoints

### Plan Review

Produce a spec or implementation plan, then send it to a second reviewer.

Default: GitHub Copilot Claude Sonnet 4.6. If the normal Copilot Claude path is
unavailable or quota exhausted, use `gemini-2.5-pro` before retrying with
GitHub Copilot GPT-5 mini. If both local CLIs are unavailable, use the matching
Codex reviewer subagent.

### Test Review

After writing tests but before running the broad sign-off suite or using those
tests as approval evidence, send the test strategy and assertions to a second
reviewer.

Default: use the repo wrapper `pnpm review:test`. If both local CLIs are
unavailable, use the matching tool-native reviewer profile, prompt, or Codex
reviewer subagent instead of silently self-approving.

### Implementation Review

After the first working implementation, self-check, and reviewable verification
story are ready, send the change to a second reviewer.

Default: `pnpm review:implementation` keeps Gemini Flash Preview using the CLI
model id `gemini-3-flash-preview` first for normal or sensitive implementation
reviews. Its auto router may start with the matching Codex reviewer subagent
only when the context contains an explicit small non-sensitive changed-file
list, that list exactly matches the repo's current changed-file set, the scope
is non-sensitive, and no review/governance surfaces are touched.

Otherwise fall back in this order: GitHub Copilot GPT-5 mini, then the matching
Codex reviewer subagent. Escalate to GitHub Copilot Claude when blocking
findings remain or when the change touches auth, secrets, filesystem, shell
execution, network behavior, or public contracts.

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
  running `pnpm review:approve-pre-implementation -- --reviewer
<copilot-claude|copilot-gpt-5-mini|gemini-2.5-pro|codex-subagent> --focus
<area> --summary "<approval summary>"` after the plan review passes.
- Use `pnpm review:status` to inspect the gate and `pnpm review:reset` to clear
  it manually when needed.

## Checkpoint Commands

- `pnpm review:plan`: normal plan-review path.
- `pnpm review:plan:risky`: risky plan review pinned to Gemini Pro.
- `pnpm review:test`: normal test-review path.
- `pnpm review:implementation`: normal implementation-review auto-routing path.
- `pnpm review:copilot`: explicit Copilot escalation path.
