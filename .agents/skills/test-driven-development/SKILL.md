---
name: test-driven-development
description: Drives development with tests. Use when implementing any logic, fixing any bug, or changing any behavior. Use when you need to prove that code works, when a bug report arrives, or when you're about to modify existing functionality.
---

# Test-Driven Development

Checkpoint skill for proving changed behavior with tests. Load it only when behavior actually needs evidence.

## When to Use

- New logic or behavior needs proof.
- A bug fix needs a reproduction test and regression guard.
- Existing behavior is being modified or refactored.
- Tests are being prepared for the `Test Review` checkpoint.

**Do not use** for pure docs, static copy, or config-only changes with no behavioral impact.

## Load / Do Not Load

- Load this skill at the test checkpoint, not during entry or general planning.
- Do not keep it loaded by default once the test checkpoint is complete.

## Core Workflow

1. **Choose the Smallest Useful Test Level:** Favor fast unit tests first, then integration or E2E only when the risk requires it.
2. **Red-Green-Refactor:** Write a failing test, make it pass with the smallest change, then refactor safely.
3. **Prove-It for Bugs:** Reproduce the bug with a failing test before implementing the fix.
4. **Route Test Review:** Send the test strategy and assertions through `Test Review` before running the broad sign-off suite or using those tests as approval evidence.
5. **Verify Locally:** Ensure every changed behavior is covered, the relevant suite passes, and no tests were skipped or disabled.

## Ask / Escalate

- Ask when there is no reliable test seam, the environment needed for the test is unavailable, or the reproducer cannot be made deterministic.
- Escalate when browser or runtime proof is also needed or when the change crosses auth, filesystem, shell, network, or public-contract boundaries.

## References

- Detailed guidance: `references/guidance.md`
- Anti-patterns and rationalizations: `references/anti-patterns.md`
