# Code Review Checklist

Use this checklist to ensure all five axes of the review are covered.

---

`## Review: [PR/Change title]`

### Pre-Review Package

- [ ] The change description explains what changed and why.
- [ ] The related spec, bug, or task context is available.
- [ ] The verification story is included.

### Context

- [ ] I understand what this change does and why it's needed.

### Tests

- [ ] Tests exist for the change.
- [ ] Tests cover the behavior, not just the implementation.
- [ ] Edge cases are tested (nulls, empty, zero, etc.).
- [ ] The tests would fail if the behavior was broken.

### Correctness

- [ ] The code does what the spec/task requires.
- [ ] Error paths are handled gracefully.

### Readability & Simplicity

- [ ] Variable and function names are clear and descriptive.
- [ ] The control flow is easy to follow.
- [ ] The code is not clever at the expense of readability.
- [ ] There is no unnecessary complexity or premature generalization.

### Architecture

- [ ] The change follows existing design patterns from the codebase.
- [ ] There is no unnecessary code duplication.
- [ ] The change does not introduce unwanted coupling between modules.
- [ ] Any new dependencies have been vetted and are justified.

### Security

- [ ] User input is validated and sanitized at system boundaries.
- [ ] Secrets are not stored in the code.
- [ ] There are no obvious injection vulnerabilities.
- [ ] Authentication and authorization are checked where necessary.

### Performance

- [ ] There are no obvious N+1 query patterns.
- [ ] There are no unbounded loops or data queries.
- [ ] List endpoints are paginated.

### Verification Story

- [ ] The changed behavior has a clear verification story.
- [ ] Residual risk is stated plainly when evidence is partial.

### Docs & Release Freshness

- [ ] Any user-facing or operator-facing behavior changes are reflected in the relevant docs.
- [ ] Handoff or release notes are complete enough that another engineer can understand what changed.

### Adversarial Challenge

- [ ] I looked for failure modes beyond the happy path.
- [ ] I considered authorization, malformed input, stale state, concurrency, and rollback behavior where relevant.

### Feedback Loop

- [ ] Findings are labeled `Critical`, `Important`, or `Nitpick`.
- [ ] Related findings are grouped by root cause where possible.
- [ ] The requested follow-up work is small enough to route back through the right checkpoint.

### Final Verdict

- [ ] **Approve** - This change is a net positive and is ready to merge.
- [ ] **Request changes** - There are mandatory issues that must be addressed before merge.
