# Refactor Ledger Template

Use this template when a preparatory refactor or Phase 3.5 checkpoint performs behavior-preserving refactoring.

## Refactor Ledger: [Task or Change Title]

- **Trigger:** [large-file pressure | semantic duplication | mixed responsibility | hard-to-test logic | current-change orphan code | preparatory refactor]
- **Scope:** [files or modules touched]
- **Behavior-preserving claim:** [what stayed externally unchanged]
- **Responsibility moved or simplified:** [short description]
- **Duplication removed:** [short description or "none"]
- **Verification before refactor:** [command/check/result]
- **Verification after refactor:** [command/check/result]
- **Review checkpoint needs:** [none | implementation review | specialist reviewer]
- **Residual debt or follow-up:** [short description or "none"]

Preferred location order:

1. Existing repo-tracked plan/spec file, when the task already has one.
2. Commit message extended description, when Phase 4 has not opened and no plan/spec exists.
3. Implementation review context or final handoff.

Do not create standalone per-task ledger files just to satisfy this template.
