---
name: fastapi-patterns
description: Repo-specific Python/FastAPI conventions for law-prep-ai-service. Load when working with Python services, FastAPI routers, Pydantic models, or Poetry dependencies.
---

# FastAPI Patterns

Repo-local Python and FastAPI conventions for this Nx monorepo.

## When to Use

- Writing or modifying Python code in `apps/law-prep-ai-service`.
- Working with FastAPI routers, Pydantic models, or service modules.
- Managing Poetry dependencies or Python tooling configuration.

## Load / Do Not Load

- Load this skill when the task touches Python code in
  `apps/law-prep-ai-service`.
- Do not load for frontend, Java, or desktop-only tasks.

## Core Workflow

1. Load `.agents/references/stack-conventions/python.md` for the full
   convention set.
2. Use `from __future__ import annotations` and full type hints on public
   functions.
3. Follow configured tooling: Ruff (line length 88), Pyright (Python 3.13),
   pytest, Poetry.

## Ask / Escalate

- Escalate to `api-and-interface-design` for public API or contract changes.
- Escalate to `security-reviewer` for auth, secrets, or input validation
  concerns.

## References

- Full conventions: `.agents/references/stack-conventions/python.md`
- Repo topology: `.agents/references/repo-map.md`
