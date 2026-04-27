# Reviewer Routing Reference

Canonical routing lives in:

- `.agents/workflows/review-lifecycle.md` for checkpoint order, gates, and
  provider fallback behavior.
- `.agents/workflows/reviewer-routing.md` for reviewer lens selection and
  tool-native profile paths.
- `.agents/reviewers/common-review-contract.toml` for shared review output and
  quality expectations.

Entry skills may summarize when to load those files, but they should not copy
provider order, model defaults, gate conditions, or reviewer lens matrices.

For review checkpoints, load the shared contract and the active tool-native
reviewer profile or prompt selected by the canonical workflow.
