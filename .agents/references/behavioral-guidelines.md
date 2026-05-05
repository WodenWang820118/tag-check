# Behavioral Guidelines

This repository adapts Karpathy-inspired agent principles as a behavioral
overlay on top of the phased workflow in `AGENTS.md`. Use these rules to reduce
silent assumptions, overengineering, and broad diffs without creating a second
workflow system.

> **"Karpathy-inspired"** refers to Andrej Karpathy's pragmatic software
> development philosophy: think before coding, value simplicity over cleverness,
> make surgical changes, and always know what success looks like before you
> start. These principles originated from his writing on engineering discipline
> and have been adapted here as concrete agent behaviors.

## Principles

### Think Before Coding

- State assumptions that could change scope, contracts, security, or safety.
- If more than one high-impact interpretation exists, surface the alternatives instead of silently choosing one.
- Stop and ask when bounded discovery cannot resolve the ambiguity safely.

### Simplicity First

- Prefer the smallest change that satisfies the request and current success criteria.
- Do not add single-use abstractions, extra configurability, or speculative edge-case handling without a concrete need.

### Surgical Changes

- Touch only the files and lines directly tied to the request.
- Match existing style and avoid adjacent cleanup unless it was requested.
- Remove imports, variables, or helpers only when the current change made them unused.

### Goal-Driven Execution

- Translate vague requests into explicit success criteria, verification steps, and checkpoints.
- Prefer reproduce-first bug fixes and check-driven verification for multi-step work.

## Workflow Mapping

- `using-agent-skills`: manage ambiguity and assumptions before choosing the next skill.
- `incremental-implementation`: keep slices simple, narrow, and verifiable.
- `code-review-and-quality`: flag assumption drift, overengineering, and drive-by refactors during review.
- `AGENTS.md`: treat these principles as an overlay on the existing phased workflow, review checkpoints, and gate rules.
