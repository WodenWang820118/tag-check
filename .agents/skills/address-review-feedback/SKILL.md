---
name: address-review-feedback
description: Turns review findings into the smallest safe remediation plan. Use when plan, test, or implementation review returns actionable comments and you need to respond without widening scope.
---

# Address Review Feedback

Post-review remediation skill for converting reviewer findings into safe follow-up work.

## When to Use

- A plan review returns blocking or important findings.
- A test review exposes weak assertions, missing coverage, or flaky verification.
- An implementation review returns required changes, critique, or reviewer comments.
- The user explicitly asks to address review feedback, critique, or reviewer findings.

## Load / Do Not Load

- Load this skill after a review checkpoint returns actionable findings.
- Do not use it as a substitute for the initial review checkpoint itself.
- Do not keep it loaded once the remediation is done and the work has returned to normal implementation or review flow.

## Core Workflow

1. **Restate Reviewer Intent:** Capture what the reviewer is protecting, not just the literal wording of the comment.
2. **Classify the Finding:** Mark each item `Critical`, `Important`, or `Nitpick` so required work is obvious.
3. **Reduce the Fix Plan:** Convert findings into the smallest safe set of in-scope changes before editing.
4. **Apply Only In-Scope Remediation:** Fix the required issue, avoid opportunistic rewrites, and note follow-up work separately.
5. **Route Back to the Right Checkpoint:** Re-run the affected plan, test, or implementation checkpoint before calling the work done.

## Ask / Escalate

- Ask when a reviewer request conflicts with the approved spec, scope, or product intent.
- Escalate when addressing the finding would change public contracts, permissions, persistent data, shell/filesystem behavior, network boundaries, or cross-repo sync scope.

## References

- Detailed guidance: `references/guidance.md`
