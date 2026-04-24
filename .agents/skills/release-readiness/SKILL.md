---
name: release-readiness
description: Prepares an implementation for handoff or release without pushing code. Use when you need docs freshness, a clear verification story, release notes, and explicit residual risk before the work is considered ready.
---

# Release Readiness

Closeout skill for deciding whether a change is ready to hand off, merge, or ship.

## When to Use

- The implementation is done and needs a final readiness pass.
- Docs or operator notes may be stale.
- The user wants a concise release summary or handoff note.

## Load / Do Not Load

- Load this after implementation, tests, and QA evidence are available.
- Do not use it to push branches, open PRs, or bypass review checkpoints.

## Core Workflow

1. **Check Docs Freshness:** Identify docs, prompts, or operator guidance that should change with the implementation.
2. **Assemble the Verification Story:** Summarize tests, QA evidence, and any reviewer outcomes that support readiness.
3. **Call Out Residual Risk:** Make incomplete evidence, deferred work, and known limitations explicit.
4. **Write the Handoff Summary:** Produce a concise release/readiness note another engineer can trust.

## Ask / Escalate

- Ask when merge or release readiness depends on rollout policy, stakeholder sign-off, or docs ownership outside the repo.
- Escalate when blocking review findings or unresolved high-risk issues remain.

## References

- Detailed guidance: `references/guidance.md`
