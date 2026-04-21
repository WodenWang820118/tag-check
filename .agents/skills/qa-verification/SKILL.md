---
name: qa-verification
description: Verifies implemented behavior with evidence. Use after implementation to gather proof, reproduce user flows, and decide whether the session is report-only or fix-enabled. Browser repos can route through proofshot; non-browser repos should use smoke checks, tests, and structured findings.
---

# QA Verification

Post-implementation verification skill for gathering evidence before final sign-off.

## When to Use

- A change is implemented and needs user-flow verification.
- You need screenshots, proof artifacts, smoke-check evidence, or a structured bug report.
- The user explicitly wants QA, dogfooding, browser proof, or report-only verification.

## Modes

- `report-only` default: inspect, test, and report findings without changing repo-tracked files.
- `fix-enabled`: verify first, then fix the confirmed issues that fall inside scope.

## Load / Do Not Load

- Load this skill after implementation, not during entry or initial planning.
- Do not use it as a substitute for `test-driven-development` or code review checkpoints.

## Core Workflow

1. **Choose the Verification Path:** Browser-visible repos use the browser path and may invoke `proofshot`; non-browser repos use smoke tests, task commands, and structured findings.
2. **Collect Evidence First:** Reproduce the flow, capture failures, and note what passed.
3. **Respect the Mode Boundary:** `report-only` stops at evidence and findings. `fix-enabled` may edit only after the evidence is recorded.
4. **Summarize the Verification Story:** Record what was checked, what failed, what was fixed, and what residual risk remains.

## Ask / Escalate

- Ask when the expected user flow is ambiguous or the environment needed for verification is unavailable.
- Escalate when verification exposes auth, data-loss, filesystem, shell, network, or public-contract risk.

## References

- Detailed guidance: `references/guidance.md`
