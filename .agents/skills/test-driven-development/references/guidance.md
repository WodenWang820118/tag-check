# Guidance for Test-Driven Development

TDD is a design and verification discipline. The test is the first concrete statement of the behavior you intend to ship.

## Red-Green-Refactor

### RED

- Write the smallest failing test that proves the behavior does not exist yet.
- If the test passes immediately, it is either not testing the intended behavior or the behavior already exists.

### GREEN

- Make the test pass with the smallest change that satisfies the contract.
- Prefer simple, direct code over early generalization.

### REFACTOR

- Clean the implementation only after the behavior is protected by a passing test.
- Keep rerunning the relevant suite while refactoring.

## Choosing the Test Level

- Prefer unit tests first for most logic and contract changes.
- Use integration tests when the main risk is a boundary between units.
- Use E2E or browser verification only for the critical flow that truly needs end-to-end proof.

## Completion Standard

- Do not call the behavior done because one new test passed once.
- Confirm the changed behavior is covered at the right level.
- State plainly when evidence is partial, flaky, or environment-limited.
- Route the test strategy through the repo's `Test Review` checkpoint before using it as approval evidence.

## Characteristics of Good Tests

- fast enough to run repeatedly
- independent of execution order
- repeatable across environments
- self-validating
- tightly connected to the changed behavior
