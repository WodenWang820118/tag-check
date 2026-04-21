---
name: nx-workspace
description: "Explore and understand Nx workspaces. USE WHEN answering questions about the workspace, projects, or tasks. ALSO USE WHEN an nx command fails or you need to check available targets/configuration before running a task. EXAMPLES: 'What projects are in this workspace?', 'How is project X configured?', 'What depends on library Y?', 'What targets can I run?', 'Cannot find configuration for task', 'debug nx task failure'."
---

# Nx Workspace Exploration

Read-only exploration skill for Nx projects, targets, dependencies, and workspace configuration.

## When to Use

- Answering questions about the workspace, projects, or targets.
- Checking what a project can run before invoking Nx tasks.
- Debugging missing target or configuration errors.

## Load / Do Not Load

- Load this skill for read-only workspace truth gathering.
- Do not skip it and guess project names, targets, or flags from memory.

## Core Workflow

1. **Start with Nx Truth:** Use `nx show projects` and `nx show project <name> --json` instead of partial config guesses.
2. **Inspect the Resolved Target:** Check inferred and explicit target configuration before running commands.
3. **Read Workspace-Level Config:** Use `nx.json` and relevant schema/docs when target defaults or plugins matter.
4. **Trace Dependencies Deliberately:** Use the Nx graph or affected tooling when the question is about impact.
5. **Report the Real Shape:** Summarize projects, roots, targets, or blockers using resolved config, not assumptions.

## Ask / Escalate

- Ask when multiple candidate projects or targets match the user's intent.
- Escalate when the workspace configuration is corrupted or the required Nx plugin/tooling is missing.

## References

- Detailed guidance: `references/guidance.md`
- Affected-project workflows: `references/AFFECTED.md`
