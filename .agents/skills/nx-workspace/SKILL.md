---
name: nx-workspace
description: "Explore Nx workspaces and run tasks. USE WHEN answering questions about the workspace, projects, or targets; running build, test, lint, serve, or any Nx task; debugging Nx command failures. EXAMPLES: 'What projects are in this workspace?', 'How is project X configured?', 'What depends on library Y?', 'run tests for project X', 'Cannot find configuration for task'."
---

# Nx Workspace Exploration & Task Execution

Combined skill for workspace discovery and task execution in Nx monorepos.
Explore first, then run.

## When to Use

- Answering questions about the workspace, projects, or targets.
- Checking what a project can run before invoking Nx tasks.
- Running build, test, lint, serve, or any Nx-defined task.
- Debugging missing target or configuration errors.

## Load / Do Not Load

- Load this skill for any Nx workspace interaction (read or write).
- Do not skip it and guess project names, targets, or flags from memory.
- Do not assume Nx CLI is globally installed; always prefix with the
  workspace package manager (e.g., `pnpm nx`, `npm exec nx`).

## Phase 1: Exploration (Read-Only)

1. **Start with Nx Truth:** Use `nx show projects` and `nx show project <name> --json` instead of partial config guesses.
2. **Inspect the Resolved Target:** Check inferred and explicit target configuration before running commands.
3. **Read Workspace-Level Config:** Use `nx.json` and relevant schema/docs when target defaults or plugins matter.
4. **Trace Dependencies Deliberately:** Use the Nx graph or affected tooling when the question is about impact.
5. **Report the Real Shape:** Summarize projects, roots, targets, or blockers using resolved config, not assumptions.

## Phase 2: Task Execution

### Understand which tasks can be run

Check via `nx show project <projectname> --json`. It contains a `targets`
section with information about targets. You can also look at `package.json`
scripts or `project.json` targets, but you might miss inferred tasks from Nx
plugins.

### Run a single task

```
nx run <project>:<task>
```

### Run multiple tasks

```
nx run-many -t build test lint typecheck
```

Flags: `-p` filter to specific projects, `--exclude` to exclude,
`--parallel` to control parallelism (default 3).

Examples:

- `nx run-many -t test -p proj1 proj2` — test specific projects
- `nx run-many -t test --projects=*-app --exclude=excluded-app` — test by pattern
- `nx run-many -t test --projects=tag:api-*` — test by tag

### Run tasks for affected projects

```
nx affected -t build test lint
```

Compares against the base branch by default. Customize:

- `nx affected -t test --base=main --head=HEAD`
- `nx affected -t test --files=libs/mylib/src/index.ts`

### Useful flags (apply to `run`, `run-many`, `affected`)

- `--skipNxCache` — rerun even when cached
- `--verbose` — print stack traces
- `--nxBail` — stop after first failure
- `--configuration=<name>` — use a specific configuration (e.g. `production`)

For more details on any command, run it with `--help`.

## Ask / Escalate

- Ask when multiple candidate projects or targets match the user's intent.
- Escalate when workspace configuration is corrupted or the required Nx
  plugin/tooling is missing.
- Escalate to Nx docs (`nx_docs`) for unfamiliar flags, advanced config, or
  migration guides.

## References

- Detailed exploration guidance: `references/guidance.md`
- Affected-project workflows: `references/AFFECTED.md`
