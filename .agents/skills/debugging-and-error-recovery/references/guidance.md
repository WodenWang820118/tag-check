# Guidance for Debugging and Error Recovery

## Stop-The-Line Discipline

- Do not stack new feature work on top of a failing baseline.
- Capture logs, repro steps, screenshots, environment details, and raw error text before changing the system again.

## Systematic Debugging Order

1. preserve the evidence
2. reproduce the failure reliably
3. localize the failing layer or boundary
4. reduce the failing case until the trigger is obvious
5. inspect the broken contract or expectation
6. fix the smallest root cause
7. verify recovery with the relevant checks

## Localization Questions

- Is the failure in the code, the test, or the environment?
- Did the breakage start after a known change?
- Is there shared state, timing, or configuration involved?
- Which boundary first disagrees with the expected contract?
- Can the problem be reduced to a minimal failing case?

## Recovery Guardrails

- Add a regression test when the behavior can be captured deterministically.
- State clearly if the final verification is partial or environment-limited.
- If the issue is non-reproducible, document the observed conditions and the next monitoring step.
- Do not claim root cause until the reduced repro and the fix both point at the same failure story.
