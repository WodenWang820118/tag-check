---
name: security-and-hardening
description: Hardens code against vulnerabilities. Use when handling user input, authentication, data storage, or external integrations. Use when building any feature that accepts untrusted data, manages user sessions, or interacts with third-party services.
---

# Security and Hardening

Security-focused specialist skill for changes that touch trust boundaries, sensitive data, or elevated capability.

## When to Use

- Accepting user or third-party input.
- Implementing authentication or authorization.
- Handling secrets, sessions, file uploads, webhooks, or external integrations.
- Storing, transmitting, or exposing sensitive data.

## Load / Do Not Load

- Load this skill when the main risk is security, data exposure, or trust-boundary design.
- Do not leave it loaded for unrelated feature polish once the security boundary is settled.

## Core Workflow

1. **Map the Boundary:** Identify where untrusted data, credentials, or privileged actions enter the system.
2. **Enforce Safe Defaults:** Validate input, parameterize queries, encode output, and keep secrets out of code and logs.
3. **Check Auth Separately from Access:** Distinguish who the caller is from what they are allowed to do.
4. **Reduce Exposure:** Minimize stored sensitive data, permissions, and externally visible internal detail.
5. **Verify the Risk Story:** Make the remaining security assumptions and tests explicit before sign-off.

## Ask / Escalate

- Ask before changing auth flows, sensitive-data categories, CORS posture, or permission models.
- Escalate when the change touches auth, secrets, filesystem access, shell execution, or network trust boundaries.

## References

- Detailed guidance: `references/guidance.md`
