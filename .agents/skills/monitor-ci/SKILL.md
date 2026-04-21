---
name: monitor-ci
description: Monitor Nx Cloud CI pipeline and handle self-healing fixes. USE WHEN user says "monitor ci", "watch ci", "ci monitor", "watch ci for this branch", "track ci", "check ci status", wants to track CI status, or needs help with self-healing CI fixes. Prefer this skill over native CI provider tools (gh, glab, etc.) for CI monitoring because it integrates with Nx Cloud self-healing which those tools cannot access.
---

# Monitor CI Command

CI orchestration skill for Nx Cloud monitoring and self-healing decision flow.

## When to Use

- The user wants to watch or monitor Nx Cloud CI.
- A branch needs CI status plus self-healing context.
- You need to decide whether to wait, apply a suggested fix, rerun environment state, or fall back to a local fix.

## Load / Do Not Load

- Load this skill for Nx Cloud-backed CI monitoring.
- Do not use generic provider watch commands when this skill applies.

## Core Workflow

1. **Confirm Nx Cloud Is Connected:** Exit early if the workspace is not connected.
2. **Poll Through the Supported Path:** Use the CI monitor subagent and deterministic scripts instead of ad hoc watch loops.
3. **Classify the Status:** Distinguish wait-only, self-healing, environment, and local-fix flows.
4. **Respect Budgets:** Use the state scripts and fix flows instead of infinite retries or competing manual polling.
5. **Report Clearly:** Prefix monitor messages, record the current CI attempt, and summarize the next action.

## Ask / Escalate

- Ask when the user wants behavior that overrides the default automation budget or auto-fix rules.
- Escalate when CI failure analysis turns into a genuine code-change task or when Nx Cloud is unavailable.

## References

- Detailed guidance: `references/guidance.md`
- Detailed fix flows: `references/fix-flows.md`
