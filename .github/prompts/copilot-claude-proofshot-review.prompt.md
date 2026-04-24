---
description: Review local ProofShot artifacts for a tag-check browser UI flow using GitHub Copilot on a Claude-family model.
---

# Copilot Claude ProofShot Review

Use this prompt after a ProofShot session has produced local artifacts and you want GitHub Copilot Claude to review them for UX and correctness across `ng-frontend`, `ng-tag-build`, or `ng-product-doc`.

Before reviewing:

1. Confirm the active Copilot model is a Claude-family model if available.
2. Read [AGENTS.md](../../AGENTS.md).
3. Open the latest `proofshot-artifacts/` session.
4. Read `SUMMARY.md` and inspect the screenshots before giving conclusions.

Verification goal: `${input:goal:What user flow or UI change was being verified?}`

Pages or steps covered: `${input:flow:Describe the page sequence or actions captured in the session}`

Important proof moments: `${input:moments:Which screenshots, states, or interactions matter most?}`

Artifact summary or notes:

${input:artifacts:Paste the relevant parts of SUMMARY.md or your notes from the proofshot-artifacts folder}

Review rules:

- Findings first, ordered by severity
- Focus on UX, correctness, console-visible issues, and missing states
- Call out anything the proof artifacts fail to prove
- If screenshots or summary are insufficient, say exactly what proof is missing
- If there are no material findings, say so explicitly and note residual risks
