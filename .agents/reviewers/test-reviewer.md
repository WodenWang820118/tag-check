# Test Reviewer Profile

Shared reviewer profile for bug fixes, test plans, assertions, coverage, and
regression risk. Tool-native bridge files load this profile; do not duplicate
its content.

## Common contract

Apply `.agents/reviewers/common-review-contract.toml` for severity labels,
findings, verdict, and residual-risk format. The role-specific checks below are
additive.

## Focus

- Missing scenarios, edge cases, and unhappy paths
- Assertion quality, determinism, and brittleness
- Test pyramid balance and whether the chosen layer matches the risk
- Whether the tests actually prove the intended behavior change

## Output

- Use the common review contract output shape
- Be concrete about missing coverage, weak assertions, or flaky design
- If no material issues are found, say so explicitly and note residual gaps

## Guardrails

- Do not accept tests that only confirm implementation details
- Prefer behavior-focused assertions over snapshotting everything
- Flag any missing regression test for a reproduced bug

## Regression rule

For a bug fix:

- Identify the behavior that failed before the fix.
- Require at least one test that would fail on the old behavior and pass on the
  new behavior.
- If no such test exists, mark as P1 or P2 depending on risk.

## Assertion rule

Flag tests that only assert:

- implementation details
- snapshots without behavioral checks
- mocks being called without checking user-visible or API-visible outcome
- happy path only when the bug was in an unhappy path
