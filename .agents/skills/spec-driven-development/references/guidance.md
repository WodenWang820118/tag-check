# Guidance for Spec-Driven Development

The goal of a spec is to expose assumptions and make the intended change reviewable before implementation begins.

## Recommendation-First Clarification

- Resolve discoverable facts from the repo first.
- If ambiguity remains, ask narrow questions that materially change scope, contracts, or success criteria.
- When possible, recommend a default instead of presenting a blank choice.

## What a Good Spec Covers

- **Objective:** what changes and why it matters
- **Current state:** the relevant repo truth or baseline
- **Approach:** the intended technical direction and boundaries
- **Verification:** the tests, reviews, and evidence that will prove the change
- **Non-goals:** what is intentionally excluded
- **Open questions or assumptions:** anything that could still change the plan

## Sectioned Drafting

Draft the spec in short, reviewable sections instead of dumping everything at once:

1. user or operator outcome
2. scope boundaries
3. technical shape
4. verification story
5. unresolved assumptions

This keeps the review focused and surfaces disagreements earlier.

## Spec Quality Bar

A reviewer should be able to answer these questions from the spec alone:

- what problem is being solved
- what is in scope and out of scope
- what public or internal contracts are changing
- how the work will be verified
- what could still go wrong

If the reviewer cannot answer those questions, the spec is still too vague.

## Common Failure Modes

- writing the spec after implementation has already started
- burying the real user outcome under implementation detail
- leaving verification as a generic statement instead of concrete checks
- skipping non-goals and forcing implementers to infer scope boundaries
