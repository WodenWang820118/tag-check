---
name: angular-patterns
description: Repo-specific Angular conventions and patterns for law-prep-web. Load when working with Angular components, services, DI, signals, routing, or tests.
---

# Angular Patterns

Repo-local Angular conventions for this Nx monorepo.

## When to Use

- Writing or modifying Angular components, services, directives, or pipes.
- Working with Angular DI, providers, or injection tokens.
- Configuring routes or app-level providers.
- Writing Angular tests with TestBed.

## Load / Do Not Load

- Load this skill when the task touches Angular code in `apps/law-prep-web`.
- Do not load for backend, AI-service, or desktop-only tasks.

## Core Workflow

1. Load `.agents/references/stack-conventions/angular.md` for the full
   convention set.
2. Follow existing workspace patterns over generic framework advice.
3. Keep components focused on presentation; delegate HTTP and business logic to
   services.

## Ask / Escalate

- Escalate to `frontend-ui-engineering` for UI-heavy work.
- Escalate to `ux-reviewer` for accessibility or UX state concerns.

## References

- Full conventions: `.agents/references/stack-conventions/angular.md`
- Repo topology: `.agents/references/repo-map.md`
