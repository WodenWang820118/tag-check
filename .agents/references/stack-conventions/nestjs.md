# NestJS Stack Conventions

Use this file for NestJS work after reading `AGENTS.md`.
When in doubt, prefer the patterns already used in the workspace.

- Prioritize NestJS dependency injection.
- Keep controllers thin; delegate business logic to services.
- Use explicit DTO types; prefer constructor injection.
- Test with focused unit specs and simple stubs.