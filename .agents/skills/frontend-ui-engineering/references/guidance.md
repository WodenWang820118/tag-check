# Guidance for Frontend UI Engineering

## Quality Bar

- Avoid generic AI-looking layouts when the task calls for original UI work.
- Favor composition over over-configured mega-components.
- Keep state ownership simple and close to where it matters.

## Implementation Heuristics

- presentation components render
- containers orchestrate
- services or data hooks fetch and transform

Choose the simplest state model that matches the problem:

- local state for local interaction
- lifted state for a few siblings
- context for shared read-heavy concerns
- URL state for shareable filters or navigation state

## UX Checklist

- loading state
- empty state
- error state
- keyboard and focus behavior
- mobile and desktop layout sanity

## Verification

If the change is browser-visible and risk is meaningful, route through `qa-verification` and optionally `proofshot` for human-reviewable evidence.
