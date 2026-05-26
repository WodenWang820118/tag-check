---
name: agent-preflight
description: Pre-flight checklist that every primary agent runs before opening the pre-implementation gate. Confirms task size, primary AI family, cross-family reviewer routing, grill-me requirement, and the exact `pnpm review:approve-pre-implementation` flags to use.
---

# Agent Preflight

A short, mandatory pre-flight every primary agent walks before the pre-implementation gate is opened. It exists so that task size, AI-family routing, and grill-me requirements are decided **once, up front**, instead of being reconstructed at each review checkpoint.

## When to Use

- Right after the plan is drafted and **before** running `pnpm review:approve-pre-implementation`.
- After any scope change that could move the task across a size boundary or onto a sensitive surface.
- Skip only for `tiny` tasks (typo, formatting-only, mechanical one-line change).

## Load / Do Not Load

- Load alongside `using-agent-skills` whenever a non-trivial change is starting.
- Do **not** repeat the full review-lifecycle; that lives in `.agents/workflows/review-lifecycle.md`.
- Do **not** preload reviewer skills here; the gate flags decide which reviewer is invoked later.

## Core Workflow

1. **Identify primary family.** State which AI family is doing the work: `copilot`, `gemini`, or `codex`. This is the running agent's family, not the user's preference.
2. **Classify task size.** Use `.agents/workflows/task-sizing.md` to pick `tiny | small | medium | large | huge`. Record rationale in one sentence.
3. **Flag sensitive surface.** Mark `yes` if the change touches auth, secrets, filesystem, shell, network, public contracts, persistent state, or governance/control-plane files. Otherwise `no`.
4. **Decide grill-me requirement.** Apply the rule: `require_grill = (size ∈ {medium, large, huge}) OR (refactoring_risk ∈ {medium, high}) OR sensitive_surface`. If `require_grill = yes`, the griller's family **must** differ from the primary family.
5. **Pick the cross-family reviewer.** Choose a reviewer whose family differs from the primary. Same-family reviewers are only allowed in `--mode override` with an explicit `--override-reason`.
6. **Compose the gate command.** Emit the exact `pnpm review:approve-pre-implementation -- ...` invocation including `--reviewer`, `--primary-family`, `--task-size`, optional `--max-files`, and (if applicable) `--mode override --override-reason "<rationale>"`.
7. **Record the preflight summary** in the plan section before opening the gate. The plan reviewer refuses to sign without this summary for any non-`tiny` task.

## Ask / Escalate

- Ask if the primary family is unclear (rare; usually self-evident).
- Escalate to the user if every available reviewer is same-family. Do not silently flip to `--mode override`; require an explicit `--override-reason`.
- Escalate to `grill-me` immediately when the rule above fires; do not defer to plan review.

## Output Template

```
Agent preflight
- Primary family: <copilot|gemini|codex>
- Task size: <tiny|small|medium|large|huge>  (rationale: ...)
- Refactoring risk: <none|low|medium|high>
- Sensitive surface: <yes|no>  (categories: ...)
- Grill-me required: <yes|no>  (griller family if yes: <copilot|gemini|codex>)
- Cross-family reviewer: <copilot-claude|gemini-3.5-flash-high|codex-subagent>
- Gate mode: <standard|override>  (override reason if any: ...)
- Max files cap: <number|unbounded>
- Gate command:
  pnpm review:approve-pre-implementation -- \
    --reviewer <id> \
    --primary-family <family> \
    --task-size <size> \
    [--max-files <n>] \
    [--mode override --override-reason "<rationale>"]
```

## References

- Task sizing rules: `.agents/workflows/task-sizing.md`
- Reviewer routing matrix: `.agents/reviewers/routing-matrix.md`
- Review lifecycle (full): `.agents/workflows/review-lifecycle.md`
- Cross-family grill rules: `.agents/skills/grill-me/SKILL.md`
- Default `--max-files` per size: `.agents/references/agent-roles.md` (and `defaultMaxFilesForSize` in `tools/scripts/review-gate/shared/shared.ts`)
