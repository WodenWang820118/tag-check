---
name: incremental-implementation
description: Delivers changes incrementally. Use when implementing any feature or change that touches more than one file. Use when you're about to write a large amount of code at once, or when a task feels too big to land in one step.
---

# Incremental Implementation

Execution-discipline skill for building changes in thin, verifiable slices.

## When to Use

- Implementing any multi-file change.
- Building a new feature from an approved task breakdown.
- Refactoring existing code without losing control of scope.

## Load / Do Not Load

- Load this skill during implementation for multi-file work.
- Do not use it for trivial one-file edits where the scope is already minimal.

## Core Workflow

1. **Pick the Smallest Useful Slice:** Choose one complete, testable step instead of a wide partial rewrite.
2. **Prefer the Simplest Viable Change:** Implement the minimum code that solves the slice. Do not add speculative abstractions, extra configurability, or future-proofing that the request does not need.
3. **Keep Changes Surgical:** Avoid mixing feature work with adjacent cleanup, formatting churn, or unrelated refactors. Remove only the imports, variables, or helpers that the current slice made unused.
4. **Verify Before Expanding:** Run the relevant tests or checks after each slice.
5. **Carry Forward Only Stable State:** Leave the repo compilable and reviewable between slices.
6. **Repeat Until Done:** Expand slice-by-slice instead of front-loading the entire feature.

## Ask / Escalate

- Ask when the implementation cannot be sliced safely without a feature flag, migration plan, or contract-first step.
- Escalate when the requested scope would force a broken intermediate state or broad cross-cutting refactor.

## References

- Behavioral overlay: `../../references/behavioral-guidelines.md`
- Detailed guidance: `references/guidance.md`
