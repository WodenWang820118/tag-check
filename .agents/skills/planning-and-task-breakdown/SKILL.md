---
name: planning-and-task-breakdown
description: Breaks work into ordered tasks. Use when you have a spec or clear requirements and need to break work into implementable tasks. Use when a task feels too large to start, when you need to estimate scope, or when parallel work is possible.
---

# Planning and Task Breakdown

Planning skill for turning an approved spec into ordered, implementation-ready slices.

## When to Use

- You have a spec and need to break it into implementable units.
- A task feels too large or vague to start.
- Work needs sequencing, checkpoints, or parallelism decisions.
- You need a task list another engineer or agent can execute safely.

**Do not use** for obvious one-file changes or when the approved spec already includes decision-complete tasks.

## Load / Do Not Load

- Load this skill after `spec-driven-development` or another approved planning artifact.
- Keep implementation and checkpoint skills unloaded until the task list is reviewable.

## Core Workflow

1. **Carry Forward the Framing:** Preserve the chosen scope mode and product framing from `product-and-scope-review` or the spec.
2. **Map Dependencies:** Identify what must exist first, what can run in parallel, and what should stay sequential.
3. **Slice for Verification:** Prefer thin vertical slices that can be implemented, tested, and reviewed without broad ambiguity.
4. **Write Reviewable Tasks:** Give each task acceptance criteria, verification steps, and likely touch points.
5. **Add Checkpoints:** Insert explicit review or verification checkpoints between major phases.
6. **Stop at Decision-Complete:** The output should leave no hidden sequencing or interface decisions for implementation.

## Ask / Escalate

- Ask when the task breakdown depends on unresolved architectural choices, ownership boundaries, or rollout constraints.
- Escalate if the requested scope cannot be sliced safely without changing public contracts, data shape, or permissions.

## References

- Detailed guidance: `references/guidance.md`
