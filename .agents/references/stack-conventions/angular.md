# Angular Stack Conventions

Use this file for Angular work after reading `AGENTS.md`.
When in doubt, prefer the patterns already used in the workspace.

- Prioritize Angular dependency injection. Prefer `inject()` over constructor injection.
- Prefer standalone components and signals for state management.
- Keep HTTP calls in dedicated services; keep components focused on presentation.
- Test with Angular `TestBed` and direct assertions.