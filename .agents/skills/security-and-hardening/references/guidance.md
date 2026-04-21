# Guidance for Security and Hardening

## Always-Do Basics

- validate external input at the boundary
- parameterize data-store access
- encode or sanitize user-controlled output
- keep sessions and secrets in server-controlled storage and configuration
- log operational context, not sensitive payloads

## Questions To Ask

- What data is untrusted here?
- What capability is privileged here?
- What would an attacker try to inject, replay, or exfiltrate?
- What is the smallest permission set that still works?

## High-Risk Areas

- authentication flow changes
- authorization gaps
- file upload and path handling
- shell or subprocess execution
- webhook verification
- third-party callback or API parsing

## Review Expectations

Security-relevant changes should leave behind both a control story and a verification story, not just “we used a safe library.”
