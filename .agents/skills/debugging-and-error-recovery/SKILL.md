---
name: debugging-and-error-recovery
description: Guides systematic root-cause debugging. Use when tests fail, builds break, behavior doesn't match expectations, or you encounter any unexpected error. Use when you need a systematic approach to finding and fixing the root cause rather than guessing.
---

# Debugging and Error Recovery

Debugging skill for preserving evidence, finding the root cause, and preventing recurrence.

## When to Use

- Tests fail after a code change.
- The build breaks.
- Runtime behavior does not match expectations.
- A bug report or production-like failure arrives.

## Load / Do Not Load

- Load this skill when the main job is diagnosis, not feature work.
- Do not keep it loaded once the failure is understood and implementation has returned to a normal slice.

## Core Workflow

1. **Stop the Line:** Pause feature work and preserve the evidence before making more changes.
2. **Reproduce Reliably:** Get to a deterministic failing case or document why reproducibility is missing.
3. **Localize the Fault:** Narrow the issue to the layer, dependency, or boundary that is actually failing.
4. **Fix the Root Cause:** Avoid symptom-only changes and add the smallest useful guard against recurrence.
5. **Verify Recovery:** Re-run the relevant checks and confirm the failure story is closed.

## Ask / Escalate

- Ask when the expected behavior is unclear, the environment is unavailable, or the failure cannot be reproduced with confidence.
- Escalate when the issue suggests data loss, auth bypass, security exposure, or a third-party outage.

## References

- Detailed guidance: `references/guidance.md`
