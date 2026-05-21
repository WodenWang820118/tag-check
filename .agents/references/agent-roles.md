# Agent Roles

Roles are platform-agnostic capabilities. Each role maps to one or more
concrete agents per platform. Use this file when picking the right concrete
agent so that `AGENTS.md` and the workflow files do not need per-platform
delegation tables.

## Roles

### `code-explorer` (read-only)

Read-only codebase mapping: identify affected files, symbols, Nx project
boundaries, cross-cutting coupling. Does not modify files. Use before
multi-file changes when scope is unclear.

| Platform           | Concrete agent                                                   |
| ------------------ | ---------------------------------------------------------------- |
| Copilot (this)     | `Explore` sub-agent                                              |
| Codex CLI          | `codebase-mapper` (`.codex/agents/codebase-mapper.toml`)         |
| Antigravity/Gemini | `agy` preferred; grep + read tooling (no dedicated mapper agent) |

### `code-investigator` (read-only)

Focused mid-task code investigation. Use when the Main Thread needs deeper
understanding of a specific code path, call chain, dependency, or impact area
during planning, implementation, debugging, or review.

This differs from `code-explorer` / `codebase-mapper`:

- `codebase-mapper`: broad initial map before implementation.
- `code-investigator`: focused deep dive during the task.

| Platform           | Concrete agent                                                             |
| ------------------ | -------------------------------------------------------------------------- |
| Copilot            | `Explore` sub-agent, with focused investigation prompt                     |
| Codex CLI          | `code-investigator` (`.codex/agents/code-investigator.toml`)               |
| Antigravity/Gemini | `agy` preferred; grep + read tooling with read-only instruction (advisory) |

### `griller` (interactive interview)

Cross-family grill of a plan or design. See `.agents/skills/grill-me/SKILL.md`.

| Platform           | Concrete agent                                       |
| ------------------ | ---------------------------------------------------- |
| Copilot            | `grill-me` skill (loaded into main agent)            |
| Codex CLI          | `grill-me` sub-agent (`.codex/agents/grill-me.toml`) |
| Antigravity/Gemini | `grill-me` skill (loaded into main agent)            |

### `plan-reviewer`

Default plan review. See `.agents/workflows/review-lifecycle.md`.

| Platform           | Concrete agent / wrapper                    |
| ------------------ | ------------------------------------------- |
| Copilot            | Copilot Claude Sonnet 4.6                   |
| Antigravity/Gemini | `gemini-2.5-pro` (`pnpm review:plan:risky`) |
| Codex CLI          | Codex reviewer subagent (fallback only)     |

### `implementation-reviewer`

Default implementation review.

| Platform           | Concrete agent / wrapper                                     |
| ------------------ | ------------------------------------------------------------ |
| Antigravity/Gemini | `gemini-3-flash-preview` (`pnpm review:implementation`)      |
| Copilot            | Copilot Claude (`pnpm review:copilot`, sensitive escalation) |
| Codex CLI          | Codex reviewer subagent (fallback only)                      |

### `domain-implementer` — Angular

Angular frontend implementation (Tier 2 domain). Covers `apps/ng-frontend`,
`apps/ng-tag-build`, and `apps/ng-product-doc`.

| Platform | Concrete agent     |
| -------- | ------------------ |
| Copilot  | `angular-frontend` |

## Adding a new platform

When adding a new tool / platform:

1. Add a row under each role this platform supports.
2. Do **not** add per-platform delegation tables to `AGENTS.md` or workflow
   files. Reference roles instead.
3. If the platform supports `grill-me`, document its `mode: "grill"` payload
   shape in the platform's bridge file.
