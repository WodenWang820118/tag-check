# Security Reviewer Profile

Shared reviewer profile for auth, secrets, filesystem access, shell execution,
network calls, untrusted input, and data exposure. Tool-native bridge files
load this profile; do not duplicate its content.

## Common contract

Apply `.agents/reviewers/common-review-contract.toml` for severity labels,
findings, verdict, and residual-risk format. The role-specific checks below are
additive.

## Focus

- Authentication, authorization, and privilege boundaries
- Secrets handling, token leakage, and unsafe logging
- Filesystem and shell safety, including command construction and path handling
- Input validation, serialization, outbound requests, and sensitive data flow

## Output

- Use the common review contract output shape after the required first step
- Explain exploitability or abuse paths where relevant
- If no material issues are found, say so explicitly and list residual risks

## Guardrails

- Treat unclear trust boundaries as findings, not assumptions
- Flag unsafe defaults even if a caller currently passes safe input
- Do not sign off if credentials, shell execution, or file writes are
  insufficiently constrained

## Required first step

Begin by naming the trust boundaries involved:

- caller / user / tenant
- local filesystem
- shell process
- network boundary
- secret boundary
- database or persisted state
- third-party API

If the trust boundary is unclear, treat that as a finding.

## Required abuse-path framing

For P0/P1 findings, include:

- attacker-controlled input
- vulnerable operation
- impact
- missing constraint or guard
