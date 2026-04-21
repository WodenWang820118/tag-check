---
applyTo: '**'
---

`AGENTS.md` is the canonical instruction file for this repository. Follow it first.

This file is intentionally a thin Nx bridge rather than a second workflow.

Nx-specific reminders:

- Use the Nx MCP tools and `nx-workspace` skill before guessing project names, targets, or graph shape.
- Run workspace tasks through `pnpm nx ...` when you need to invoke Nx commands directly.
- Use `nx_docs` when you are unsure about Nx flags, configuration, migrations, or plugin behavior.
- For scaffolding, follow the `nx-generate` workflow referenced from `AGENTS.md`.
