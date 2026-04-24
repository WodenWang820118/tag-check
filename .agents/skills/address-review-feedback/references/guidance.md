# Guidance for Addressing Review Feedback

Use this skill to turn review output into clear, minimal remediation instead of reacting comment-by-comment without a plan.

## Reviewer-Intent Discipline

Start by naming what the reviewer is protecting:

- correctness
- security or permission boundaries
- architecture or contract clarity
- test credibility
- user-facing UX or copy quality

If the intent is unclear, ask before editing. Do not guess at hidden requirements.

## Severity Taxonomy

- `Critical`: blocks progress until fixed or explicitly re-scoped
- `Important`: should be fixed in the current slice unless a reviewer agrees it can be deferred
- `Nitpick`: optional polish that should not widen scope

Treat unprefixed blocking comments as at least `Important` until clarified.

## Minimal Remediation Loop

1. group related findings
2. restate the change needed in plain language
3. choose the smallest safe implementation
4. update tests or verification if the finding affects evidence
5. return to the relevant checkpoint

When several comments share one root cause, fix the root cause once instead of scattering small edits across the repo.

## Safe Response Patterns

- If the reviewer is right, say what changed and how it was verified.
- If the reviewer is partly right, fix the valid concern and state the boundary you intentionally kept.
- If the reviewer is wrong or out of scope, respond with repo evidence, spec context, or constraint data instead of opinion.

## Anti-Patterns

- fixing every comment literally without understanding the shared root cause
- expanding the change set with opportunistic cleanup
- treating `Nitpick` feedback as a reason to redesign the feature
- re-running only tests while skipping the checkpoint that produced the finding
- saying "addressed" without stating what changed or what verification closed the loop
