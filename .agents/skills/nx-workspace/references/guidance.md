# Guidance for Nx Workspace Exploration

## Preferred Commands

- `nx show projects`
- `nx show project <name> --json`
- `nx graph --file <...>` or other repo-approved graph workflows when dependency questions matter

## Why Resolved Config Matters

`project.json` often shows only part of the truth. `nx show project --json` includes inferred targets and plugin-added behavior, which is what the workspace will actually run.

## Common Exploration Questions

- what projects exist?
- what targets does this project really have?
- which executor or command backs this target?
- what workspace defaults affect this target?
- what projects are affected by a change?
