---
name: using-agent-skills
description: Discovers and invokes the repo-local skill set. Use when starting work or when you need to choose the right workflow for the current task.
---

# Using Agent Skills

Entry routing skill for minimal context loading. Use it to understand the request, resolve only the ambiguity that matters, and choose the next workflow skill without preloading the whole chain.

## When to Use

- At the start of a new task.
- When a task needs to be re-scoped after major ambiguity is uncovered.

## Load / Do Not Load

- Load this skill with `AGENTS.md` by default.
- Load `nx-workspace` immediately for Nx exploration/debugging and `nx-generate` immediately for Nx scaffolding/setup when repo rules require them.
- Do **not** preload planning, implementation, test, or review skills from here. Select 1 next skill and hand off.

## Core Workflow

1. **Intent Gate:** If the prompt has 2 or more plausible high-impact interpretations, name the interpretations and ask 1 decision question before repo exploration. Do not pick silently.
2. **Bounded Discovery:** Otherwise, prefer repo truth. State any assumption that materially affects scope, contracts, or safety, then use at most 2 targeted commands or inspect at most 3 files to resolve discoverable facts.
3. **Clarification Budget:** Ask at most 1 pre-scan question and 1 post-scan question. If high-impact ambiguity remains after that budget, stop and ask or escalate. Do not continue on conflicting assumptions or hidden confusion.
4. **Workflow Selection:** Choose 1 next skill:
   - solution-framed request, fuzzy problem statement, or unclear ambition/scope: `product-and-scope-review`
   - new feature or significant change: `spec-driven-development`
   - bug or failing behavior: `debugging-and-error-recovery`
   - actionable review findings, critique, or reviewer comments that need remediation: `address-review-feedback`
   - post-implementation verification or evidence gathering: `qa-verification`
   - release closeout, docs freshness, or handoff completeness: `release-readiness`
   - UI-heavy work: `frontend-ui-engineering`
   - API or contract work: `api-and-interface-design`
   - repo or Nx workflow: the specific repo skill, then exit this entry workflow
5. **Checkpoint Timing:** `test-driven-development` and `code-review-and-quality` load only at their checkpoints, not during entry.

## Ask / Escalate

- Ask when ambiguity would change architecture, public contracts, auth or security boundaries, persistent data, require broad exploration, or still has multiple plausible interpretations after bounded discovery.
- Escalate reviewer routing and checkpoint defaults through `references/reviewer-routing.md` rather than restating the full lifecycle here.

## References

- Behavioral overlay: `../../references/behavioral-guidelines.md`
- Skill catalog: `references/skills-catalog.md`
- Reviewer routing and checkpoint defaults: `references/reviewer-routing.md`
- Stack conventions: `.agents/stack-conventions.md`
