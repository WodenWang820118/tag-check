---
name: spring-boot-patterns
description: Repo-specific Java/Spring Boot conventions for law-prep-engine. Load when working with Java services, controllers, DTOs, repositories, or Spring configuration.
---

# Spring Boot Patterns

Repo-local Java and Spring Boot conventions for this Nx monorepo.

## When to Use

- Writing or modifying Java code in `apps/law-prep-engine`.
- Working with Spring Boot services, controllers, repositories, or
  configuration.
- Defining DTOs, request/response types, or value objects.
- Writing Java tests.

## Load / Do Not Load

- Load this skill when the task touches Java code in `apps/law-prep-engine`.
- Do not load for frontend, Python, or desktop-only tasks.

## Core Workflow

1. Load `.agents/references/stack-conventions/java.md` for the full
   convention set.
2. Follow existing workspace patterns over generic framework advice.
3. Place data-only records in `contract` subpackages; keep behavior in parent
   packages.

## Ask / Escalate

- Escalate to `api-and-interface-design` for public API or contract changes.
- Escalate to `security-reviewer` for auth, secrets, or input validation
  concerns.

## References

- Full conventions: `.agents/references/stack-conventions/java.md`
- Repo topology: `.agents/references/repo-map.md`
