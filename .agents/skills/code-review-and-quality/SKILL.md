---
name: code-review-and-quality
description: Conducts multi-axis code review. Use before merging any change. Use when reviewing code written by yourself, another agent, or a human. Use when you need to assess code quality across multiple dimensions before it enters the main branch.
---

# Code Review and Quality

Checkpoint skill for evaluating a reviewable change set before or during `Implementation Review`.

**The Approval Standard:** Approve a change when it is a definite improvement, even if it isn't perfect. Do not block a change for stylistic preferences if it follows project conventions. The goal is continuous improvement, not perfection.

## When to Use

- Before merging any change.
- After completing a feature implementation.
- When evaluating code produced by another agent or human.
- After fixing a bug to review both the fix and the regression test.

## Load / Do Not Load

- Load this skill at the implementation review checkpoint or for explicit review tasks.
- Do not preload it during entry, planning, or general implementation.

## Core Workflow

1. **Understand the Context:** Review the task, spec, and intended behavior before reading the diff.
2. **Review Tests First:** Use the tests to confirm intended behavior, regression coverage, and edge-case handling.
3. **Challenge Hidden Assumptions and Overreach:** Look for ambiguous requests that were resolved silently, premature abstraction, speculative flexibility, and drive-by refactors outside the task. Confirm any Phase 3.5 refactor has a ledger, or that a skipped checkpoint has a one-line rationale; treat unrelated cleanup as overreach.
4. **Review Across Five Axes:** Correctness, readability and simplicity, architecture, security, and performance.
5. **Check Freshness and Challenge Assumptions:** Look for stale docs, incomplete release notes, and any failure mode that the happy path review missed.
6. **Categorize Findings Clearly:** Use `Critical`, `Important`, or `Nitpick` so required changes are obvious.
7. **Verify the Verification Story:** Confirm what was tested, what built successfully, and what still carries residual risk.
8. **Route Implementation Review:** Add specialist reviewers when the change crosses architecture, security, test, or UX boundaries.

## Ask / Escalate

- Ask before deleting ambiguous dead code or when a change should be split into smaller reviewable slices.
- Escalate to specialist reviewers for auth, secrets, filesystem, shell, network, public contracts, or user-facing UX risk.

## References

- Behavioral overlay: `../../references/behavioral-guidelines.md`
- Detailed guidance: `references/guidance.md`
- Process and etiquette: `references/process-and-etiquette.md`
- Review checklist: `references/review-checklist.md`
- Security checklist: `references/security-checklist.md`
- Performance checklist: `references/performance-checklist.md`
