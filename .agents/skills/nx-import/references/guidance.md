# Guidance for Nx Import

## Import Strategy

- Prefer subdirectory-at-a-time import for monorepo sources.
- Use whole-repo import only when the source is effectively a single project.
- Keep the destination workspace's directory conventions unless the workspace is genuinely empty.

## Always Check After Import

- workspace globs
- root dependencies and devDependencies
- plugin registration in `nx.json`
- `targetDefaults` and `namedInputs`
- executor paths that are still rooted at the old source layout

## Common Recovery Moves

- run `nx sync --yes`
- run `nx reset` if inference or references still look stale
- fix package-manager workspace globs before debugging TypeScript resolution
