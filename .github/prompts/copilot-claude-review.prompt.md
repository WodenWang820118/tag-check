---
description: Review a plan, implementation, or test change for this repository using GitHub Copilot on a Claude-family model.
---

# Copilot Claude Review

Use this prompt when another tool has already produced a plan, implementation, or test draft and you want GitHub Copilot to act as the canonical reviewer for this repository.
Use it for normal plan reviews, normal test reviews, and implementation reviews that were explicitly escalated from Gemini.

Before reviewing:

1. Confirm the active Copilot model is a Claude-family model if available.
2. Read [AGENTS.md](../../AGENTS.md).
3. Read [`.agents/reviewers/common-review-contract.toml`](../../.agents/reviewers/common-review-contract.toml).
4. Use the matching reviewer agent from [`.github/agents`](../agents) when relevant.

Review checkpoint: `${input:checkpoint:Choose one: plan, implementation, test, or pre-merge}`

Primary focus: `${input:focus:Describe the main risk area, such as architecture, UX, tests, security, or general correctness}`

Context from the producing tool:

${input:context:Paste the plan summary, diff summary, or test summary that needs review}

Review rules:

- Apply the shared review contract for severity labels, findings, verdict, and residual-risk format
- Question risky assumptions
- Call out cross-file regressions, contract drift, and missing tests
- If this is a test review, focus on missing scenarios and weak assertions
- If this is a security-sensitive change, use the security reviewer lens
- If this is a UI change, use the UX reviewer lens
- If this is an `implementation` review, treat it as an escalation checkpoint and say clearly whether Gemini findings need additional follow-up
- If this is a `plan` review and there are no blocking findings left, open the implementation gate by running `pnpm review:approve-pre-implementation -- --reviewer copilot-claude --focus "${input:focus}" --summary "Approved after Copilot Claude plan review"`.
- If blocking findings remain, do not run the approval command and say that the implementation gate must stay closed.
