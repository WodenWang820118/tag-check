---
name: refactoring-and-simplification
description: Runs a conditional behavior-preserving refactor checkpoint. Use after a verifiable implementation slice creates large-file pressure, semantic duplication, mixed responsibility, hard-to-test logic, or current-change orphan code. Use before feature implementation only when an approved plan says a preparatory refactor is needed.
---

# Refactoring and Simplification

Checkpoint skill for simplifying current-scope code without changing observable behavior.

## When to Use

- After a completed, verified implementation slice triggers Phase 3.5.
- Before feature implementation only when the approved plan says `Preparatory refactor needed?: yes`.
- When a current change creates the third concrete copy of logic, a new mixed responsibility, hard-to-test placement, large-file pressure, or fully unused helper/module/export.

Skip this skill for tiny single-file or mechanical edits, incidental unused imports or locals, and unrelated cleanup.

## Load / Do Not Load

- Load only at the preparatory refactor point or Phase 3.5 checkpoint.
- Do not load during entry, normal planning, or the start of implementation.
- Do not use it to improve pre-existing code outside the approved scope.

## Core Workflow

1. **Confirm the Trigger:** Name the current-change trigger and confirm the slice is complete, verifiable, and has passed its minimal check. Do not interrupt mid-write.
2. **Prove Behavior Preservation:** Keep interface signatures, external contracts, data models, persistence behavior, and user-visible behavior unchanged. Rerun the same minimal verification before and after the refactor.
3. **Choose the Smallest Refactor:** Extract, move, or consolidate only the responsibility created or worsened by the current change. Avoid generic abstractions before the third concrete use.
4. **Respect Gate Boundaries:** If scope expands, contracts change, or security/persistence/process/shell/filesystem/network/external-integration risk appears, stop and return to planning before further mutation.
5. **Record the Ledger:** When a refactor is performed, complete the refactor ledger in the existing plan/spec, commit message body, implementation review context, or final handoff. If skipped after consideration, leave a one-line rationale.
6. **Route Review When Required:** Preparatory refactors that touch 3+ files or otherwise trigger implementation-review rules must pass Implementation Review before feature implementation continues.

## Ask / Escalate

- Ask when behavior preservation cannot be proven with the available checks.
- Escalate to `architecture-reviewer` by default for cross-file structural refactors.
- Add `security-reviewer`, `test-reviewer`, or `ux-reviewer` when the refactor crosses those concerns.
- Reset and rerun Plan Review if the refactor no longer matches the approved plan.

## References

- Refactor ledger template: `references/refactor-ledger-template.md`
