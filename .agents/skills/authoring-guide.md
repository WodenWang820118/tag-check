# Agent Skill Authoring Guide

This guide defines how repo-local skills should be written, slimmed, and extended.

## Goals

- Keep entry context small.
- Preserve the minimum rules an agent needs when only `SKILL.md` is loaded.
- Move long examples, checklists, and philosophy into `references/`.
- Keep workflow skills decision-oriented instead of turning them into giant operating manuals.

## When to Add a Specialist Skill

Add a new skill only when at least one of these is true:

- The workflow has repo-specific steps or guardrails that are easy to miss.
- The same specialized process is repeated across tasks.
- The task needs domain-specific tool routing that does not belong in `AGENTS.md`.

Do **not** add a new skill for one-off notes, stack conventions already covered elsewhere, or reference material that could live under another skill's `references/`.

When importing ideas from an external methodology or skills library, prefer extending the existing repo-local skills first. Add a new skill only when the imported behavior fills a real workflow gap that cannot be expressed cleanly through an existing skill and its references.

## Core `SKILL.md` Budget

- Target `SKILL.md` to stay under roughly 4 KB and about 120 lines.
- If a skill grows beyond that, move examples, checklists, templates, and extended guidance into `references/`.
- Repeat AGENTS-level rules only when that rule is phase-critical and the agent would likely fail without seeing it in the core file.
- Default workflow skills to a slim core even when the implementation playbook is long. The core file should route the agent; the references should teach the long-form process.

## Workflow Skill Rules

- If a skill supports multiple modes, list those modes explicitly in the core `SKILL.md` with the default mode.
- If a skill has both read-only and mutating variants, name the distinction plainly in the core file.
- `report-only` means gather evidence and summarize findings without changing repo-tracked files.
- `fix-enabled` means edits are allowed, but only after the evidence-gathering steps in the workflow are complete.
- Do not bury mode selection or safety boundaries inside long examples or appendix text.
- Prefer one primary outcome per workflow skill. If a skill starts doing planning, implementation, QA, and release all at once, split it.

## Minimum In-File Contract

Every `SKILL.md` should keep these items in the core file:

1. Front matter `name` and `description`
2. A short statement of the skill's purpose
3. `When to Use`
4. `Load / Do Not Load`
5. `Core Workflow`
6. `Ask / Escalate`
7. Reference links for deeper material

If the skill owns a mandatory checkpoint, the core file must also state the checkpoint timing and the minimum verification expectation for that phase.

## Reference Rules

- Put detailed rationale in `references/guidance.md`.
- Put reusable artifacts in files such as `review-checklist.md`, `template.md`, or `anti-patterns.md`.
- Link every reference file from `SKILL.md`. Do not assume the agent will discover it automatically.
- Prefer a few focused reference files over one giant appendix.
- When slimming an over-budget skill, preserve the core workflow in `SKILL.md` and move the detailed decision trees, examples, and command playbooks into `references/`.
- When importing external practices, keep the repo's existing names and phase boundaries unless the current framework has a genuine gap. Augment first; duplicate only as a last resort.

## Suggested Skeleton

```markdown
---
name: your-skill-name
description: Short description of the skill.
---

# Your Skill Name

One-sentence purpose.

## When to Use

- ...

## Load / Do Not Load

- ...

## Core Workflow

1. ...

## Ask / Escalate

- ...

## References

- Detailed guidance: `references/guidance.md`
```
