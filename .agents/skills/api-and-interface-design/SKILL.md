---
name: api-and-interface-design
description: Guides stable API and interface design. Use when designing APIs, module boundaries, or any public interface. Use when creating REST or GraphQL endpoints, defining type contracts between modules, or establishing boundaries between frontend and backend.
---

# API and Interface Design

Design skill for stable contracts that are hard to misuse and safe to evolve.

## When to Use

- Designing or changing public API endpoints.
- Defining module, package, or service boundaries.
- Creating shared DTOs, contracts, or reusable component props.
- Making changes that consumers will depend on over time.

## Load / Do Not Load

- Load this skill when the main risk is contract shape, compatibility, or caller confusion.
- Do not keep it loaded for pure implementation follow-through once the contract is settled.

## Core Workflow

1. **Design the Contract First:** Make the caller-visible behavior explicit before implementation details.
2. **Minimize the Surface Area:** Expose only what consumers truly need and avoid leaking internals.
3. **Define Error Semantics:** Keep success, failure, nullability, and versioning behavior consistent.
4. **Validate at Boundaries:** Treat incoming and third-party data as untrusted until validated.
5. **Plan for Evolution:** Prefer additive changes and document compatibility expectations before shipping.

## Ask / Escalate

- Ask when changing the contract would affect existing consumers, migrations, or cross-team ownership.
- Escalate when the change touches auth, billing, persistence, or other externally committed behaviors.

## References

- Detailed guidance: `references/guidance.md`
