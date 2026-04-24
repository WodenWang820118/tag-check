---
name: nx-import
description: Import, merge, or combine repositories into an Nx workspace using nx import. USE WHEN the user asks to adopt Nx across repos, move projects into a monorepo, or bring code/history from another repository.
---

# Nx Import

Repo skill for bringing external projects into an Nx workspace while preserving usable history and workspace integrity.

## When to Use

- Adopting Nx across existing repositories.
- Importing apps or libraries into a monorepo.
- Merging external history into the current workspace.

## Load / Do Not Load

- Load this skill before running `nx import` or planning an import strategy.
- Do not guess flags or destination layout without checking the destination workspace truth.

## Core Workflow

1. **Choose the Import Shape:** Prefer subdirectory-at-a-time for monorepo sources and whole-repo import only for single-project sources.
2. **Match Destination Conventions:** Import into the destination repo's existing app/lib layout rather than copying source conventions blindly.
3. **Plan Root Config Merges:** Expect follow-up work for dependencies, plugins, `nx.json`, workspace globs, and executor paths.
4. **Repair Workspace Linking:** Run the workspace sync and dependency fixes needed after import.
5. **Verify the Imported Projects:** Confirm targets, project discovery, and package-manager linking before calling the import complete.

## Ask / Escalate

- Ask when the destination has no clear layout convention or when import shape changes how history should be preserved.
- Escalate if the import would overwrite existing directories, introduce root config conflicts, or require broad toolchain migration.

## References

- Detailed guidance: `references/guidance.md`
- Framework-specific follow-ups: `references/ESLINT.md`, `references/GRADLE.md`, `references/JEST.md`, `references/NEXT.md`, `references/TURBOREPO.md`, `references/VITE.md`
