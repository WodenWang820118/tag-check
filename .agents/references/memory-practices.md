# Memory Practices for Context Window Management

Use this guide to manage the three-tier memory system for efficient context
window usage across large tasks.

## Memory Scopes

| Scope          | Path                 | Persistence                       | Auto-loaded     | Best For                                                    |
| -------------- | -------------------- | --------------------------------- | --------------- | ----------------------------------------------------------- |
| **User**       | `/memories/`         | Across all workspaces             | First 200 lines | Preferences, frequent commands, general patterns            |
| **Repository** | `/memories/repo/`    | Across conversations in this repo | On demand only  | Codebase conventions, architecture facts, verified commands |
| **Session**    | `/memories/session/` | Current conversation only         | On demand only  | Phase summaries, task context, in-progress decisions        |

## When to Write Memory

### Phase Boundary Summary (Session Memory)

At every natural phase boundary — after completing an implementation slice,
before starting a new phase, or after research/discovery — write a concise
summary to `/memories/session/phase-summary.md`:

```markdown
# Phase N Summary

## Completed

- What was accomplished (bullet points)
- Key files modified

## Decisions

- Architecture or design choices made, with rationale

## Open Items

- Edge cases, unresolved questions, known limitations

## Next Phase

- What the next phase should do
- Any context the next agent needs
```

This compresses dozens of tool calls into 3-5 paragraphs, freeing the context
window for the next phase.

### Repo-Specific Facts (Repository Memory)

When you discover a stable, reusable fact about the codebase that passes the
following criteria:

- Likely to have actionable implications for a future task
- Cannot always be inferred from a limited code sample
- Unlikely to change over time

Store it in `/memories/repo/` as a JSON file:

```json
{
  "subject": "Short topic label",
  "fact": "One or two sentences describing the fact.",
  "citations": ["path/to/relevant/file"],
  "reason": "Why this matters — what goes wrong without knowing it.",
  "category": "architecture|convention|tooling|security"
}
```

### User Preferences (User Memory)

Store personal, cross-workspace preferences in `/memories/`:

- Coding style preferences (tabs/spaces, naming, formatting)
- Frequently used terminal commands
- Tool configuration preferences
- Keep entries as short bullet points

## When NOT to Write Memory

- Do not duplicate what is already in `AGENTS.md`, workflow files, or
  `.agents/references/`.
- Do not store temporary or single-task state in user or repo memory (use
  session memory instead).
- Do not store secrets, credentials, or sensitive data in any memory scope.

## Phase Workflow Integration

During **Phase 3 (Implementation)**, after each verifiable slice:

1. Run minimal verification
2. Run required review checkpoints
3. Write phase summary to `/memories/session/` if work will continue
4. Commit phase changes
5. Load next phase spec and session summary before continuing

For **huge tasks**, each approved sub-plan phase should end with a session
memory write before the next phase begins or the session ends.
