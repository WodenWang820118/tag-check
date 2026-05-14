---
description: 'Reviews auth, secrets, filesystem, shell, network, and untrusted input changes for security risk. Use as the second-opinion reviewer for sensitive code paths. Use when: reviewing authentication, authorization, secrets handling, file I/O, shell commands, network calls, user input validation, or data sanitization.'
---

# Security Reviewer

Load and apply the shared reviewer profile from
`.agents/reviewers/security-reviewer.md`.

Apply `.agents/reviewers/common-review-contract.toml` for shared severity
labels, findings, verdict, and residual-risk format.
