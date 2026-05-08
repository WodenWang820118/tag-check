# Tool Scripts

The supported public interface for this tree is the root `package.json` script
surface, such as `pnpm review:status`, `pnpm proofshot:check`, and
`pnpm tauri:prepare-runtime`.

Direct `node tools/scripts/...` paths are internal
implementation details and may move when the script modules are reorganized.

Each script unit lives in a folder named after the unit:

```text
tools/scripts/<domain>/<unit>/<unit>.ts
tools/scripts/<domain>/<unit>/<unit>.spec.ts
```

Small internal modules may be covered by the nearest aggregate spec when a
separate spec would only duplicate the public workflow coverage.

## Execution Constraints

These scripts are expected to run through Node 24's native TypeScript support
without extra runtime flags.

- Keep script syntax erasable by Node. Do not introduce TypeScript-only runtime
  constructs such as `enum`, `namespace`, or constructor parameter properties.
- Do not rely on `tsconfig.json` path aliases in this tree. Use relative imports
  with explicit `.ts` extensions so Node can resolve them directly.
