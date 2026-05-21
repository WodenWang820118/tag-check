# Reviewer Routing Matrix

Cross-reference table for choosing the right reviewer lens, primary reviewer
agent, and cross-family `grill-me` partner. Apply after `AGENTS.md` and the
referenced workflow files.

This matrix is a fast lookup. The shared review contract in
`.agents/reviewers/common-review-contract.toml` and the lens-specific reviewer
profiles in this directory remain authoritative for review behavior.

## AI Family Definition

Three families participate in cross-family checks:

- **Copilot**: GitHub Copilot Claude Sonnet, Copilot GPT-_ via Copilot CLI,
  `.github/agents/_.agent.md` reviewers.
- **Gemini**: Antigravity CLI (`agy`) preferred, Gemini CLI compatibility,
  `gemini-2.5-pro`, `gemini-3-flash-preview`,
  `.gemini/commands/review/*.toml` reviewers.
- **Codex**: Codex CLI, `.codex/agents/*.toml` reviewers, including the
  `grill-me` sub-agent (`mode: "grill"` payloads).

**Cross-family rule**: the primary agent's family must differ from the family
of any `grill-me` partner and the eventual review checkpoint reviewer when the
task qualifies for cross-family enforcement (see Q2 condition below).

## Cross-Family Grill Trigger

Cross-family `grill-me` is **required** when any of the following holds:

- task size in `{medium, large, huge}`
- `Refactoring risk` in `{medium, high}`
- the change touches a sensitive surface: auth, secrets, filesystem, shell,
  process execution, network, public contracts, persistent state, or
  governance/control-plane files

Otherwise it is optional.

## Lens × Primary Reviewer × Recommended Griller

| Focus / lens                                 | Primary reviewer agent                        | Recommended griller (cross-family)                        |
| -------------------------------------------- | --------------------------------------------- | --------------------------------------------------------- |
| Plan, architecture, schemas, migrations      | `architecture-reviewer`                       | If primary = Copilot → Codex; else → Copilot Claude       |
| Tests, regressions, bug fixes, coverage      | `test-reviewer`                               | If primary = Copilot → Gemini; else → Copilot Claude      |
| Auth, secrets, filesystem, shell, network    | `security-reviewer`                           | Always Codex `grill-me` first, then `pnpm review:copilot` |
| UI, UX flows, a11y, responsive, copy         | `ux-reviewer`                                 | If primary = Copilot → Gemini; else → Copilot Claude      |
| Public APIs, cross-service contracts         | `architecture-reviewer` + `security-reviewer` | Codex `grill-me`, then Copilot Claude                     |
| Governance / control-plane (workflows, gate) | `architecture-reviewer`                       | Codex `grill-me`, then Copilot Claude (sensitive)         |

## Reviewer Wrapper Quick Reference

| Wrapper                                  | Use                                                      |
| ---------------------------------------- | -------------------------------------------------------- |
| `pnpm review:plan`                       | Default plan review (auto-routed)                        |
| `pnpm review:plan:risky`                 | Risky plan, pinned to `gemini-2.5-pro`                   |
| `pnpm review:test`                       | Test-strategy review                                     |
| `pnpm review:implementation`             | Default implementation review (Antigravity/Gemini Flash) |
| `pnpm review:copilot`                    | Sensitive escalation, Copilot Claude                     |
| `pnpm review:approve-pre-implementation` | Open the pre-implementation gate                         |
| `pnpm review:status`                     | Inspect gate state                                       |
| `pnpm review:reset`                      | Clear stale gate state                                   |

## Notes

- If the task crosses lenses, run more than one reviewer profile.
- `grill-me` results must include the 6-item end checklist defined in
  `.agents/skills/grill-me/SKILL.md` (repo overlay) before Plan Review may
  proceed.
- The `mode: "grill"` reviewer payload reuses the Codex reviewer id; older
  payloads without `mode` are interpreted as `mode: "review"`.
