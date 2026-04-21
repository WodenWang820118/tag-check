# Guidance for Incremental Implementation

## Preferred Slice Shapes

- vertical user-flow slice
- contract-first slice followed by caller integration
- risk-first spike that proves the hardest dependency early

## Executing-Plan Discipline

- Work one approved task at a time.
- Finish the current slice before starting adjacent cleanup or the next planned slice.
- Keep the repo in a stable, reviewable state between slices.
- If a slice reveals a missing decision, stop and update the plan instead of improvising a second plan in code.

## Rules of Thumb

- keep the repo buildable between slices
- run the smallest useful verification after each slice
- avoid touching adjacent files "while you are there"
- note out-of-scope cleanup instead of mixing it into the current slice

## Verification Expectations

- Every slice should have one primary verification step.
- Prefer the fastest check that proves the slice is real.
- If the slice changed the contract, verification should prove the caller and callee still agree.

## Red Flags

- more than about 100 lines without verification
- multiple unrelated concerns in one slice
- feature and refactor mixed together
- broad abstractions before the third real use case
