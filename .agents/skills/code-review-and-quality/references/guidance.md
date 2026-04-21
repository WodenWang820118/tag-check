# Detailed Guidance for Code Review

Use this reference when the slim checkpoint skill needs a fuller review playbook.

## Before Reviewing

- Read the spec, task, or bug context first.
- Read the tests before the implementation when the change includes behavior updates.
- Confirm what verification the author claims to have run before trusting the happy path.

## The Five Review Axes

### Correctness

- Does the change match the approved task or spec?
- Are error paths, empty states, and edge cases handled?
- Is there any obvious stale-state, race, or rollback risk?

### Readability and Simplicity

- Are names clear and intent-revealing?
- Is the code straightforward instead of clever?
- Has the change introduced abstractions before the code earned them?

### Architecture

- Does the change follow established boundaries and patterns?
- Is the change split into reviewable slices?
- Did a new dependency or coupling get introduced, and is it justified?

### Security

- Are inputs validated at the right boundary?
- Are permission, filesystem, shell, or network behaviors still safe?
- Does the change broaden the mutation surface in a risky way?

### Performance

- Is there an obvious scale trap, unbounded loop, or repeated heavy call?
- Does the verification story include the performance-sensitive path when relevant?

## Severity Taxonomy

- `Critical`: blocks progress or merge until fixed
- `Important`: should be fixed now unless it is consciously re-scoped
- `Nitpick`: optional polish that should not derail the slice

Group related findings by root cause when possible so the author can respond with one clear remediation plan instead of a scattershot patch.

## Requesting and Receiving Review

- A good review request includes the task context, verification story, and known residual risk.
- A good review response states what changed, what was intentionally not changed, and which checkpoint closes the loop.
- When review feedback becomes actionable work, convert it into the smallest safe remediation plan before editing.

## Change Sizing

Small changes are easier to review and safer to land:

- around 100 changed lines is ideal
- around 300 lines is still reasonable for one logical change
- around 1000 lines should usually be split

Separate refactors from feature work unless the repo context makes that impossible.
