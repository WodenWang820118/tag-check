# Guidance for Release Readiness

This skill is intentionally narrower than gstack-style shipping workflows. It improves the final handoff without owning git push or deployment.

## Evidence Before Victory

- Do not call a change ready based on intuition or optimistic wording.
- Summaries should be backed by tests, QA evidence, reviewer outcomes, or explicit operator checks.
- If evidence is missing, say so plainly and carry it into residual risk.

## Readiness Questions

- What changed for users, operators, or reviewers?
- What evidence proves the change is working?
- Which docs or workflow notes became stale?
- What risks remain, and are they acceptable?

## Expected Output

- change summary
- verification summary
- docs updated or docs still needed
- residual risk
- next recommended action, such as merge, manual QA, or another checkpoint

## Residual Risk Language

Good readiness notes say:

- what was not verified
- what still depends on manual follow-up
- which reviewer findings were deferred, if any
- whether the current state is ready for merge, handoff, or another checkpoint

## What This Skill Does Not Do

- push branches
- create PRs
- deploy services
- auto-approve unresolved review findings
