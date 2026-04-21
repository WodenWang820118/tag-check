# Guidance for Monitor CI

## Why This Skill Exists

Nx Cloud self-healing has information that normal CI provider watch commands do not expose. This skill keeps the agent inside that supported loop.

## Operating Principles

- poll lightly first, fetch heavy detail only when the status requires it
- let self-healing act before duplicating the same fix locally
- use the deterministic state scripts for budgets and gate decisions
- keep main-agent context clean by delegating one-tool Nx Cloud calls

## Main Status Buckets

- wait and report
- apply suggested fix
- rerun environment state
- attempt local fix
- exit because the budget or environment says to stop
