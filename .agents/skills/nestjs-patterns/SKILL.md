---
name: nestjs-patterns
description: Repo-specific NestJS conventions. Load when working with NestJS controllers, providers, modules, or DTOs in the monorepo.
---

# NestJS Patterns

Repo-local NestJS conventions for this Nx monorepo.

## When to Use

- Writing or modifying NestJS controllers, services, providers, or modules.
- Working with NestJS DI, guards, interceptors, or pipes.
- Defining DTOs and contract types for NestJS boundaries.

## Load / Do Not Load

- Load this skill when the task touches NestJS code in the workspace.
- Do not load for frontend-only, Java-only, or Python-only tasks.

## Core Workflow

1. Load `.agents/references/stack-conventions/nestjs.md` for the full
   convention set.
2. Keep controllers thin; delegate to services for business logic.
3. Use constructor injection; prefer explicit DTO types over `any`.

## Ask / Escalate

- Escalate to `api-and-interface-design` for public API or contract changes.
- Escalate to `security-reviewer` for auth, secrets, or transport-level
  concerns.

## References

- Full conventions: `.agents/references/stack-conventions/nestjs.md`
- Repo topology: `.agents/references/repo-map.md`
