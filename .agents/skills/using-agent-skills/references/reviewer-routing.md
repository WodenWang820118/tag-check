# Reviewer Routing and Lifecycle

This document holds the checkpoint routing details that should not be duplicated in entry skills.

## Mandatory Checkpoints

For any non-trivial task, get a second opinion before moving forward. The primary agent must not self-approve its own plan, code, or tests.

1. **Plan Review:** After producing a spec or implementation plan.
   Default provider order: Copilot Claude -> `gemini-2.5-pro` -> Codex reviewer subagent.
   **Cross-family `grill-me` (mandatory for medium+ / sensitive plans)**:
   invoke `grill-me` (`.agents/skills/grill-me/SKILL.md`) using a griller from
   a different AI family than the primary agent before submitting for Plan
   Review. Trigger conditions and the six-item end checklist are defined in
   `AGENTS.md` Cross-Family `grill-me` Rule.
2. **Test Review:** After writing tests and before running the broad sign-off suite or using those tests as approval evidence.
   Default provider order: Copilot Claude -> `gemini-2.5-pro` -> Codex reviewer subagent.
3. **Implementation Review:** After the first working implementation, self-check, and reviewable verification story are ready.
   `--provider auto` keeps `gemini-3-flash-preview` first for normal or sensitive `implementation` reviews. Low-risk `implementation` and `pre-merge` reviews may route to Codex first only when the context provides an explicit small changed-file list, that list exactly matches the repo's current changed-file set, the scope is non-sensitive, and no review/governance surfaces are touched. When that low-risk gate does not apply, the provider order is `gemini-3-flash-preview` -> Copilot Claude -> Codex reviewer subagent for `implementation`, and `gemini-2.5-pro` -> Copilot Claude -> Codex reviewer subagent for `pre-merge`. `pre-merge` is an additional wrapper mode only and does not replace the required `implementation` checkpoint. The Copilot CLI GPT-5-mini reviewer was removed from auto-routing as of 2026-05; do not reintroduce it.

## Reviewer Routing

Use `.agents/reviewers/common-review-contract.toml` as the shared review
contract. Use the active tool-native reviewer profile or prompt as the
specialist lens.

- Planning, schemas, APIs, state machines, migrations, or cross-file design: `architecture-reviewer`
- Standard Phase 3.5 refactor review and cross-cutting refactor escalation: `architecture-reviewer`
- Tests, bug fixes, regressions, assertions, and coverage: `test-reviewer`
- Auth, secrets, filesystem, shell, network, untrusted input, or data exposure: `security-reviewer`
- UI flows, accessibility, copy, empty/loading/error states, or responsive behavior: `ux-reviewer`

If a task crosses categories, combine the relevant reviewers.
