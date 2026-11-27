# AGENTS

This directory contains the `ng-frontend-e2e` Nx project.

Use the repository root [AGENTS.md](../../AGENTS.md) for workspace commands,
boundary rules, and conventions.

Local purpose: Browser end-to-end coverage for the primary Angular frontend.

The user journey test requires a backend built and started by the config on
port 7070 with a fresh data folder, network access to
https://ng-gtm-sample.vercel.app, and about 2-3 minutes to run. Run it with
`pnpm nx run ng-frontend-e2e:e2e`.

Prefer local `project.json` targets for task discovery and keep this file as a
thin bridge only.
