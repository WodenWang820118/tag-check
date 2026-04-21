# Guidance for Planning and Task Breakdown

Use this reference when the task list needs more than the slim core file.

## What Good Breakdown Looks Like

- Start from the approved spec, not from implementation impulses.
- Prefer vertical slices that produce working behavior and a clear verification story.
- Keep tasks small enough that one agent can implement and verify them without mixing unrelated concerns.
- Put the highest-risk slice early so failure happens before broad implementation investment.

## Decision-Complete Tasks

Each task should be detailed enough that another engineer or agent can execute it without inventing missing steps.

Good task shape:

- one behavioral outcome
- the likely touch points
- explicit acceptance criteria
- the exact verification command or checkpoint
- the dependency on prior slices, if any

## Recommended Task Shape

Each task should answer:

- What behavior or infrastructure becomes available after the task?
- What acceptance criteria prove the task is done?
- What commands or checks verify the task?
- What tasks must happen first?
- What files or subsystems are likely involved?

If a task says "run tests" or "verify manually," tighten it into a concrete command or user flow.

## Dependency Graph

Map the task graph before ordering:

- foundations: contracts, types, migrations, shared helpers
- orchestration: services, APIs, boundary integrations
- presentation or caller layers: UI, CLI, docs, handoff output

If two tasks share a contract, define that contract first, then split the downstream work.

## Sizing Rules

- XS: one obvious file or config edge
- S: one endpoint, component, or small helper flow
- M: one end-to-end slice across 3-5 files
- L or above: break it down further unless the repo has strong reasons not to

Red flags that mean the task is still too large:

- the title contains `and`
- acceptance criteria exceed 3 concise bullets
- the task spans independent subsystems
- verification would require multiple unrelated suites

## Checkpoints

Insert checkpoints between phases when:

- a new contract becomes authoritative
- a migration lands
- a risky integration is proven
- review should happen before the next slice compounds the change

Checkpoint wording should be explicit about what must pass before implementation continues.

Examples:

- "Checkpoint: contract approved before UI integration begins"
- "Checkpoint: implementation review passes before sync plumbing changes"
