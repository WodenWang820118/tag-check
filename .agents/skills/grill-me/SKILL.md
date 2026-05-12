---
name: grill-me
description: Repo-local overlay of the cross-family grill-me skill. Stress-test a plan or design through one-question-at-a-time interviews, with a 6-item completion checklist required before Plan Review for medium+ or sensitive tasks.
---

# grill-me (repo overlay)

Interview the user (or the primary agent's draft plan) relentlessly about
every aspect of the design until reaching shared understanding. Walk down each
branch of the decision tree, resolving dependencies one at a time. For each
question, provide your recommended answer and its reasoning.

Ask questions **one at a time**. If a question can be answered by exploring the
codebase, explore the codebase instead of asking.

## Cross-family requirement

When any of the following holds, the griller's AI family **must** differ from
the primary agent's family (see `.agents/reviewers/routing-matrix.md` for the
three-family definition):

- task size in `{medium, large, huge}`
- `Refactoring risk` in `{medium, high}`
- the change touches a sensitive surface (auth, secrets, filesystem, shell,
  network, public contracts, persistent state, governance/control-plane)

`small` and `tiny` tasks may use same-family or skip `grill-me` entirely.

## Mode payload

When the griller writes its result into the review-gate payload, set
`mode: "grill"` and include `primaryFamily`, `grillerFamily`, and `taskSize`.
Older payloads without `mode` are treated as `mode: "review"` for backwards
compatibility.

## End-of-grill checklist

Before the plan may proceed to the Plan Review checkpoint, the grill summary
must record concrete answers (not "N/A") for **all six** items below. If any
high-impact item remains unresolved, do not exit grill mode.

1. **Assumptions resolved**
   List original assumptions; mark each `confirmed` / `changed` / `dropped`.
2. **Failure modes**
   At least three most-likely failure scenarios with mitigations. State whether
   each is caught by automated verification or by reviewer inspection.
3. **Rollback path**
   Per-phase revert strategy: commit granularity, data-migration backout, or
   feature flag.
4. **Test surface**
   Files and commands the change touches; list the verification commands the
   reviewer should run.
5. **Sibling-repo impact**
   Whether `sync-skills.ps1` propagation is needed; if yes, list the sibling
   repos and files in scope.
6. **Open questions remaining**
   Tag each as `high-impact` or `low-impact`. Any `high-impact` unresolved item
   blocks exit.

## Output template

When grilling concludes, emit:

```
Grill summary
- Primary family: <copilot|gemini|codex>
- Griller family: <copilot|gemini|codex>  (must differ for medium+/sensitive)
- Task size: <tiny|small|medium|large|huge>
- Refactoring risk: <none|low|medium|high>
- Sensitive surface: <yes|no>

Checklist
1. Assumptions resolved: ...
2. Failure modes: ...
3. Rollback path: ...
4. Test surface: ...
5. Sibling-repo impact: ...
6. Open questions remaining: <none high-impact | listed below>

Verdict
- Ready for Plan Review: yes/no
- Reason: ...
```

The reviewer at the Plan Review checkpoint will refuse to sign if the grill
summary is missing or incomplete (see `must_refuse_when` in
`.agents/reviewers/common-review-contract.toml`).
