---
name: proofshot
description: Capture browser-based proof artifacts for ng-frontend. Use when the user asks for proofshot, visual proof, screenshots, video proof, browser proof, or when a UI change would benefit from human-reviewable artifacts.
---

# Proofshot

Browser-only verification helper for `ng-frontend`. Use it directly for explicit proof requests, or let `qa-verification` invoke it when the verification path needs screenshots, session video, or browser proof.

## When to Use

- The task changes browser-visible UI behavior in `ng-frontend`.
- The user explicitly says `proofshot`.
- The user asks for screenshots, video proof, browser proof, or visual proof.
- You want human-reviewable evidence before final sign-off.

## Load / Do Not Load

- Load this skill only for browser-verifiable flows.
- Do not use it for backend-only, server-only, or non-browser library tasks.

## Workflow

1. **Confirm the Browser Path:** Use this skill only after `qa-verification` or the user request has established that browser proof is the right evidence path.
2. **Ensure Proofshot Is Installed:** `npm install -g proofshot` and then `proofshot install`.
3. **Verify the CLI Is Available:** `pnpm proofshot:check`.
4. **Start a Capture Session:** `pnpm proofshot:start:web -- --description "<flow>"`.
5. **Drive the Browser Through the Flow:** Use `proofshot exec ...` or compatible browser automation commands.
6. **Stop the Capture Session:** `pnpm proofshot:stop`.
7. **Review the Artifacts:** Inspect `proofshot-artifacts/`, especially `SUMMARY.md`, `step-*.png`, and `session.webm`.

## Guardrails

- Do not use this skill for non-browser tasks.
- Do not treat proof artifacts as a substitute for tests.
- Do not commit `proofshot-artifacts/`.
