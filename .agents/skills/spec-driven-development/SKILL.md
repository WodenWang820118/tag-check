---
name: spec-driven-development
description: Creates specs before coding. Use when starting a new project, feature, or significant change and no specification exists yet. Use when requirements are unclear, ambiguous, or only exist as a vague idea.
---

# Spec-Driven Development

Planning skill for new features and significant changes. Its job is to produce a reviewable spec before implementation starts.

## When to Use

- New features or significant behavior changes.
- Requirements are ambiguous or the task needs architectural decisions.
- Public contracts, data flow, or boundaries need to be made explicit.

**Do not use** for typo fixes, clearly mechanical changes, or already-specified one-file edits.

## Load / Do Not Load

- Load this skill during planning after `using-agent-skills` selects it.
- Keep `planning-and-task-breakdown`, `incremental-implementation`, `test-driven-development`, and `code-review-and-quality` unloaded until this spec is ready for handoff.

## Core Workflow

1. **Confirm the Framing:** If the request still feels solution-framed or the real product goal is unclear, route through `product-and-scope-review` first and record the chosen scope mode.
2. **Surface Assumptions:** State what you are assuming about the request, especially anything that would change scope, architecture, contracts, or dependencies.
3. **Define Success Criteria:** Reframe vague requests into concrete, testable outcomes before drafting the spec.
4. **Draft the Spec:** Cover objective, tech stack, commands, project structure, code style example, testing strategy, boundaries or non-goals, success criteria, and open questions.
5. **Save the Spec:** For non-trivial work, save the spec to a repo file so it can be reviewed and updated.
6. **Plan Review Checkpoint:** Route the spec through the mandatory `Plan Review` before moving to task breakdown or implementation.
7. **Keep It Current:** Update the spec first if scope, contracts, data model, or architecture decisions change during the task.

## Ask / Escalate

- Ask when success criteria, boundaries, or non-goals remain ambiguous after bounded discovery.
- Stop and escalate rather than guessing about public contracts, data model changes, auth or security boundaries, CI changes, or new dependencies.

## References

- Detailed guidance: `references/guidance.md`
- Spec template: `references/spec-template.md`
