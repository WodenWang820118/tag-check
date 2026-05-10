# Tool Routing

Tool-specific bridge files are thin entry points. They must defer to
`AGENTS.md` and the workflow files referenced from it instead of redefining the
workflow.

## GitHub Copilot

- `.github/copilot-instructions.md` is a bridge file. It must not override this
  workflow.
- Prefer project skills from `.agents/skills`.
- GitHub Copilot Claude Sonnet 4.6 is the preferred scripted reviewer for plan
  reviews, test reviews, and escalated implementation reviews.
- Before using Copilot CLI for a scripted checkpoint review, confirm the local
  CLI is installed and that a constant low-cost probe still succeeds. Treat a
  failed probe as unavailability and fall back instead of sending the full
  review payload.
- Copilot hooks in `.github/hooks/review-gate.json` are the hard guardrail for
  pre-implementation review on a clean worktree.
- When using Copilot CLI and Rubber Duck is available, prefer a Claude-family
  orchestrator and enable `/experimental`.
- For plan, test, and non-low-risk implementation reviews, the auto-routed
  review wrappers should prefer Gemini CLI before Copilot GPT-5 mini. Low-risk
  `implementation` or `pre-merge` auto routing may try the matching Codex
  reviewer first only when the review context includes an explicit small
  non-sensitive changed-file list that exactly matches the repo's current
  changed-file set.
- Keep the Copilot-only retry path only when the review is explicitly pinned to
  `--provider copilot`.
- Trigger Rubber Duck critique after a plan is drafted, after an escalated
  multi-file implementation review, and after tests are written but before they
  are executed.
- If Rubber Duck is unavailable, use the matching reviewer agent in
  `.github/agents` as the required second opinion.
- If the user explicitly asks for a critique, review, second opinion, or Rubber
  Duck, force a second opinion even if the task is otherwise small.
- For browser-verifiable UI proof requests, use `qa-verification` and the
  repo-local proofshot workflow when browser artifacts are the right evidence
  path.

## Gemini CLI

- Keep using `.gemini/settings.json` with `contextFileName: "AGENTS.md"`.
- Because Gemini first-loads only `AGENTS.md`, root summaries must retain the
  precise first-load routing, review trigger, and refactor trigger rules listed
  there.
- Use `gemini-2.5-pro` for risky pre-implementation plan reviews and when
  Copilot quota or availability prevents the normal Copilot plan-review path.
- Use Gemini Flash Preview through the CLI model id `gemini-3-flash-preview` as
  the default implementation reviewer.
- Before using Gemini CLI for a scripted checkpoint review, confirm the local
  CLI is installed and that a constant low-cost probe succeeds for the intended
  model. If the probe fails, fall back instead of sending the full review
  payload.
- Apply adaptive throttling for scripted Gemini reviews:
  - `gemini-2.5-pro`: 38s start-to-start target with `35s -> 50s -> 75s` retry
    backoff
  - `gemini-3-flash-preview`: 22s start-to-start target with `20s -> 30s` retry
    backoff
- Use `.agents/reviewers` as the source of reviewer personas and escalation
  lenses for Gemini-produced reviews.

## Codex CLI

- Keep using `.codex/config.toml` as the repo-local Codex config.
- Prefer running Codex in WSL for this repository when possible.
- For non-trivial work, use `pnpm review:plan`, `pnpm review:plan:risky`,
  `pnpm review:implementation`, and `pnpm review:test` to route checkpoint
  reviews through the repo-standard wrappers.
- Use the configured reviewer subagents for plan, implementation, test, and
  UX/security review checkpoints.
- Low-risk `implementation` and `pre-merge` auto routing may select Codex first
  only when the review context includes an explicit small non-sensitive
  changed-file list that exactly matches the repo's current changed-file set.
  Plan and test checkpoints remain Copilot-led unless fallback is required.
- When Copilot CLI or Gemini CLI is not locally usable, the review wrappers
  should fall back to the matching Codex reviewer subagent instead of silently
  self-approving.

## Bridge Minimum Inline Rule Set

Bridge files may summarize these categories inline before pointing back to
`AGENTS.md`:

- canonical source and local directory map
- non-trivial work requires plan review, gate approval, targeted verification,
  and required review checkpoint
- review wrapper commands and provider-order summary
- low-risk Codex-first routing constraints
- Rubber Duck or second-opinion triggers for Copilot
- proofshot and Nx entry summaries

Bridge files must not introduce a conflicting workflow, provider order, or gate
condition.
