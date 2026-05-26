# Tool Routing

Tool-specific bridge files are thin entry points. They must defer to
`AGENTS.md` and the workflow files referenced from it instead of redefining the
workflow.

## GitHub Copilot

- `.github/copilot-instructions.md` is a bridge file. It must not override this
  workflow.
- Copilot Claude Sonnet 4.6 is the primary reviewer for plan reviews, test
  reviews, and escalated sensitive implementation reviews.
- Before using Copilot CLI for a scripted checkpoint review, confirm the local
  CLI is available with a low-cost probe. Treat a failed probe as
  unavailability and fall back.
- Copilot hooks in `.github/hooks/review-gate.json` are the hard guardrail for
  pre-implementation review on a clean worktree.
- If the user explicitly asks for a critique, review, or second opinion, force
  a second opinion even if the task is otherwise small.

## Antigravity CLI / Gemini compatibility

- Prefer Antigravity CLI (`agy`) for Google-family terminal reviews; keep
  `gemini` as the stable provider/script compatibility alias.
- Set `GX_LAW_PREP_REVIEW_GOOGLE_CLI=gemini` to force the legacy Gemini CLI
  path while debugging Antigravity-specific failures.
- Keep `.gemini/settings.json` context loading ordered with `AGENTS.md` first
  for legacy Gemini CLI. Antigravity workspace MCP servers live in
  `.agents/mcp_config.json`; remote servers use `serverUrl` rather than `url`.
- `gemini-3.5-flash-high`: plan review fallback and risky plan reviews.
- `gemini-3.5-flash-high`: primary implementation reviewer.
- Confirm CLI availability with a low-cost probe before sending full review
  payload. If `agy` fails or is unavailable, fall back to Gemini CLI and then
  the next review provider.
- Apply `.agents/reviewers/common-review-contract.toml` plus the shared
  reviewer profile for each Google-family produced review.

## Codex CLI

- Keep using `.codex/config.toml` as the repo-local Codex config.
- Codex reviewer subagents are the fallback path when Copilot and the
  Antigravity `agy` provider are unavailable. Do not silently self-approve.
- `codebase-mapper` is read-only and does not replace Plan Review.

## OpenCode

- `opencode.json` at the repo root is a thin MCP-only config. Do not add
  workflow rules or provider routing to it.
- Route checkpoint reviews through Copilot CLI, the Antigravity `agy` provider, or the matching
  `.github/agents` reviewer when working in OpenCode.

## Bridge Minimum Inline Rule Set

Bridge files may summarize these categories inline before pointing back to
`AGENTS.md`:

- canonical source and local directory map
- the smallest first-read entry points needed by that tool
- optional on-demand memory or local-tool setup notes
- proofshot and Nx entry pointers

Bridge files must not introduce a conflicting workflow, provider order, or gate
condition.
