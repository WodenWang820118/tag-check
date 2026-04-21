---
name: proofshot
description: Capture browser-based proof artifacts for tag-check UI flows. Use when the user asks for proofshot, visual proof, screenshots, video proof, browser proof, or when a browser-visible change would benefit from human-reviewable artifacts.
---

# Proofshot

Browser-only verification helper for `tag-check` UI flows. Use it directly for explicit proof requests, or let `qa-verification` invoke it when the verification path needs screenshots, session video, or browser proof.

## When to Use

- The task changes browser-visible UI behavior in `ng-frontend`, `ng-tag-build`, or `ng-product-doc`.
- The user explicitly says `proofshot`.
- The user asks for screenshots, video proof, browser proof, or visual proof.
- You want human-reviewable evidence before final sign-off.

## Load / Do Not Load

- Load this skill only for browser-verifiable flows.
- Do not use it for backend-only, Electron-shell-only, or non-browser tasks.

## Workflow

1. **Confirm the Browser Path:** Use this skill only after `qa-verification` or the user request has established that browser proof is the right evidence path.
2. **Ensure Proofshot Is Installed:** `npm install -g proofshot` and then `proofshot install`.
3. **Verify the CLI Is Available:** `pnpm proofshot:check`.
4. **Start a Capture Session:** `pnpm proofshot:start:web -- --description "Describe the UI flow being verified"`.
5. **Switch Browser App When Needed:** Use `--project ng-tag-build` or `--project ng-product-doc` when the flow is not in the default `ng-frontend` app.
6. **Drive the Browser Through the Flow:** Use `proofshot exec ...` or compatible browser automation commands.
7. **Stop the Capture Session:** `pnpm proofshot:stop`.
8. **Review the Artifacts:** Inspect `proofshot-artifacts/`, especially `SUMMARY.md`, `step-*.png`, and `session.webm`.

## Guardrails

- Do not use this skill for non-browser tasks.
- Do not treat proof artifacts as a substitute for tests.
- Do not commit `proofshot-artifacts/`.
