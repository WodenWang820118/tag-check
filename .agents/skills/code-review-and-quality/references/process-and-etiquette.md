# Code Review Process & Etiquette

## Before Asking for Review

Package the change so the reviewer can understand it quickly:

- short summary of what changed and why
- link or pointer to the spec, bug, or task
- the verification story
- any known residual risk or intentional limitation

Do not make the reviewer reconstruct the context from the diff alone.

## Reviewer Etiquette

- Review the change that was requested, not the entirely different change you wish had been built.
- Be direct about required issues and relaxed about pure preference.
- Prefer findings grouped by root cause instead of several comments on the same symptom.
- Separate blocking issues from polish so the author can respond efficiently.

## Author Response Etiquette

- Restate the finding in your own words before fixing it if the root cause is not obvious.
- Explain what changed, not just "done."
- If you disagree, ground the response in spec context, repo constraints, or concrete evidence.
- If the reviewer is right but the fix is out of scope, escalate instead of silently widening the change.

## Severity Prefixes

- `Critical:` blocks progress or merge
- `Important:` should be fixed in the current slice unless re-scoped
- `Nitpick:` optional polish
- `FYI:` informational only

## Turning Findings into Work

When feedback becomes implementation:

1. group related findings
2. identify the shared root cause
3. write the smallest safe remediation plan
4. apply the changes
5. return to the affected checkpoint

This keeps review feedback from turning into an unplanned rewrite.
