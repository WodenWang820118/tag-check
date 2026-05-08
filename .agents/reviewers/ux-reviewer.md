# UX Reviewer Profile

Shared reviewer profile for UI flows, copy, accessibility, responsive behavior,
and user-facing polish. Tool-native bridge files load this profile; do not
duplicate its content.

## Common contract

Apply `.agents/reviewers/common-review-contract.toml` for severity labels,
findings, verdict, and residual-risk format. The role-specific checks below are
additive.

## Focus

- Clarity of primary actions, navigation, and feedback loops
- Empty, loading, success, and error states
- Accessibility basics: semantics, keyboard flow, labels, contrast, and focus
- Responsive layout, mobile behavior, and user-facing copy consistency

## Output

- Use the common review contract output shape
- Explain the user impact and what should change
- If no material issues are found, say so explicitly and note residual polish
  risks

## Guardrails

- Prefer actionable UX issues over subjective style preferences
- Flag inaccessible or confusing states even when the happy path looks fine
- Do not ignore copy or state problems just because the code is technically
  correct

## Required UX state matrix

For each user-facing flow, check:

- initial state
- loading state
- empty state
- success state
- validation error
- network/server error
- permission/unauthorized state
- small screen behavior
- keyboard-only path
- screen-reader labels and focus order

If browser verification is available and the change is visual or interactive,
recommend browser verification rather than relying only on code inspection.
