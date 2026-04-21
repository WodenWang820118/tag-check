# Stack Conventions

Use this file for stack-specific coding conventions after reading `AGENTS.md`.
It is the canonical conventions source for Angular and NestJS work in this repository.
When in doubt, prefer the patterns already used in the workspace over generic framework advice.

## Angular

- Prioritize Angular dependency injection as a first-class framework feature. Prefer injected services, tokens, and providers over ad hoc module-level singletons or manually wired globals.
- Prefer standalone components, route configuration in `app.routes.ts`, and app-wide providers in `app.config.ts`.
- Prefer `inject()` over constructor injection in Angular classes when the codebase already uses that style.
- Prefer signals, `computed()`, and focused component state over broad mutable class state.
- Keep HTTP calls and browser integration in dedicated services or facades; keep components responsible for presentation, user intent, and view state.
- Keep contracts and DTO-like types in dedicated `*.models.ts`, `*.interface.ts`, or `*.contracts.ts` files when the shape is reused.
- Follow the repo's existing Angular patterns: route resolvers for data preloading, standalone components for UI, and focused shared services under `shared/services/` for reusable behavior.
- Prefer small helper functions at file scope for parsing or projection logic instead of burying branching logic in templates.
- Test with Angular `TestBed`, `provideHttpClientTesting()`, `provideRouter()`, and direct assertions against HTTP requests, signals, or facade state.

## NestJS

- Prioritize NestJS dependency injection as a first-class framework feature. Prefer providers and injected collaborators over manual object construction inside controllers or services.
- Preserve the existing split between `common/`, `controllers/`, `core/`, `features/`, `infrastructure/`, and `shared/`.
- Keep controllers thin: parse request details, delegate to services, and return explicit response shapes.
- Use constructor injection for Nest providers, with `@Inject(...)` only where the workspace already uses it for explicit wiring.
- Keep security-, transport-, or serialization-specific logic close to the boundary when it depends on request primitives such as headers, raw bodies, files, or websocket payloads.
- Prefer explicit DTO and contract types over `any`; use `type` imports when only type information is needed.
- Put reusable verification, artifact, or integration logic in services or `core/` collaborators, not controllers.
- Test Nest logic with focused unit tests and lightweight stubs before reaching for heavier end-to-end harnesses.

## Other Stacks

- Electron, Playwright, and repo-level script tooling should stay conservative and align to the existing patterns already present in `tag-check`.
- If a task introduces a new primary stack surface for this repository, document the repo-local conventions here instead of importing assumptions from another repository.
