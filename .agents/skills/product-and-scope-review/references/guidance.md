# Guidance for Product and Scope Review

This skill borrows the strongest part of structured brainstorming without turning the repo into a second top-level workflow.

## Recommendation-First Discovery

- Use repo truth first, then ask only the questions that materially change scope, audience, or success criteria.
- When asking, lead with a recommendation instead of handing the user a blank page.
- Ask one high-leverage question at a time when the answer changes the downstream spec.

Good pattern:

- "I recommend `reduce` because the current ask mixes onboarding, analytics, and admin tooling. If that sounds right, we should validate the core operator flow first."

## Sectioned Validation

When the framing is still unstable, validate it in short sections instead of one long wall of text:

1. the real problem
2. the chosen scope mode
3. the success criteria
4. the explicit non-goals

Each section should be short enough that the user can react to it directly.

## What the Handoff Must Contain

The output should hand cleanly into `spec-driven-development`:

- the real problem statement
- the chosen mode: `hold`, `expand`, or `reduce`
- the assumptions that still matter
- the main success criteria
- the non-goals that keep the scope honest

## How To Choose a Mode

- Choose `hold` when the request is close to the right wedge and the main risk is hidden assumptions.
- Choose `expand` when a slightly broader framing clearly improves the user outcome or removes a predictable trap.
- Choose `reduce` when the ask is too broad, too risky, or packed with speculative work.

## Red Flags

- debating implementation details before the user outcome is clear
- asking several low-value questions at once
- expanding scope because the broader idea sounds more impressive
- reducing scope so hard that the remaining change no longer tests the real need
