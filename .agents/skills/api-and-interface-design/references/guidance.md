# Guidance for API and Interface Design

## Core Principles

- Contract first: define what callers can rely on before writing implementation code.
- Consistent semantics: similar operations should behave the same way on success and failure.
- Boundary validation: validate user and third-party data at entry points, not deep inside the system.
- Evolution-aware design: treat observable behavior as something consumers may depend on.

## What To Make Explicit

- input and output shapes
- required vs optional fields
- partial-update semantics
- ordering, pagination, and idempotency behavior
- error codes or error-result conventions

## Compatibility Bias

- Prefer additive fields over destructive rewrites.
- Avoid forking the same interface into multiple versions unless there is no safer path.
- Document any deprecation or migration expectations before implementation starts.

## Common Failure Modes

- exposing implementation details through error text or field names
- mixing `null`, exceptions, and error objects inconsistently
- validating the same input repeatedly instead of trusting post-validation types
- creating an interface that is technically correct but awkward for the main caller
