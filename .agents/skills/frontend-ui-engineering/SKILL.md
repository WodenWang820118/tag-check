---
name: frontend-ui-engineering
description: Builds production-quality UIs. Use when building or modifying user-facing interfaces. Use when creating components, implementing layouts, managing state, or when the output needs to look and feel production-quality rather than AI-generated.
---

# Frontend UI Engineering

Specialist skill for building polished, accessible, design-aware user interfaces.

## When to Use

- Building new UI components or pages.
- Modifying existing user-facing interfaces.
- Implementing responsive layouts or interaction states.
- Fixing UX, accessibility, or presentation quality issues.

## Load / Do Not Load

- Load this skill when the primary risk is user-facing UI quality.
- Do not keep it loaded for backend-only or contract-only work.

## Core Workflow

1. **Respect the Existing Design Language:** Follow the repo's patterns unless the task explicitly calls for a new visual direction.
2. **Keep Components Focused:** Separate presentation, orchestration, and data access.
3. **Build Real States:** Include empty, loading, error, and success states where the feature needs them.
4. **Design for Accessibility:** Keep semantics, keyboard behavior, copy, and responsive behavior intentional.
5. **Verify the UI Story:** Use tests, manual inspection, and `qa-verification` or `proofshot` when browser evidence matters.

## Ask / Escalate

- Ask when the target experience, design constraints, or responsive expectations are unclear.
- Escalate when the change crosses design-system boundaries or needs product/design approval.

## References

- Detailed guidance: `references/guidance.md`
