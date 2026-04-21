---
name: product-and-scope-review
description: Reframes solution-framed requests into product-aware planning inputs. Use when the user presents a feature idea, the real problem is fuzzy, or scope/ambition needs to be deliberately held, expanded, or reduced before drafting the spec.
---

# Product and Scope Review

Planning-front-door skill for clarifying the problem before formal spec work begins.

## When to Use

- The request jumps straight to a solution without clearly stating the problem.
- Scope feels too vague, too small, or suspiciously overbuilt.
- You need to choose whether to hold, expand, or reduce scope before planning.

## Modes

- `hold` default: keep scope close to the ask, but challenge hidden assumptions.
- `expand`: broaden scope only when it creates a meaningfully better product outcome.
- `reduce`: cut to the smallest wedge that can still validate the real user need.

## Load / Do Not Load

- Load this skill before `spec-driven-development` when product framing is still unstable.
- Do not use it for already-approved specs, tiny mechanical tasks, or pure implementation follow-through.

## Core Workflow

1. **Name the User Problem:** Restate the request in terms of user pain, outcome, or operational need.
2. **Challenge the Framing:** Surface the assumptions hidden inside the proposed solution.
3. **Choose a Scope Mode:** Use `hold`, `expand`, or `reduce` deliberately and state the choice.
4. **Write the Planning Handoff:** Produce the framing, chosen scope mode, key tradeoffs, and success criteria that the spec must inherit.

## Ask / Escalate

- Ask when the right scope depends on business priorities, rollout appetite, or audience differences that are not discoverable from the repo.
- Escalate if changing scope would alter security boundaries, pricing, external contracts, or persistent data commitments.

## References

- Detailed guidance: `references/guidance.md`
