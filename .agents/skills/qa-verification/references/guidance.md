# Guidance for QA Verification

## Browser Path

Use the browser path when the behavior is visible in a web UI and human-reviewable proof would materially reduce risk.

- Use `proofshot` for screenshots, session video, and summarized browser evidence.
- Keep the verification story tied to an actual user or operator flow, not just a component snapshot.
- Report console errors, broken states, accessibility issues, missing copy, and empty/loading/error state problems.

## Non-Browser Path

Use the CLI or service path when browser proof is not relevant.

- Run the smallest commands that prove the behavior end to end.
- Capture deterministic output where possible.
- Separate hard failures from minor polish findings.

## Evidence-First Completion

- Verification starts by collecting evidence, not by making opportunistic fixes.
- "It should work now" is not evidence.
- If verification is partial, say exactly what was not proven.

## Mode Discipline

- `report-only` means no repo-tracked edits, even if the fix looks obvious.
- `fix-enabled` still starts with evidence gathering; do not fix first and call it verification later.

## Residual Risk

Call out the leftover uncertainty explicitly:

- environment was unavailable
- only a partial flow was exercised
- browser proof exists but automated checks did not run
- automated checks passed but a manual operator flow was not exercised

## Suggested Output Shape

- scope verified
- commands or flows executed
- what passed
- findings
- fixes applied, if mode allowed them
- residual risk
