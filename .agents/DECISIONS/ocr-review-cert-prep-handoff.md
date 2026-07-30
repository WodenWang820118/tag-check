# OCR Review and Cert Prep Handoff Decisions

- The review gate is opt-in and applies to host-owned structuring only; the
  existing automatic runtime-structuring path remains unchanged.
- Review edits are an overlay, not a mutation of CaptureDocumentV1. Runtime
  provenance validation therefore remains strict and unchanged.
- Segment edits are per page/segment. IDs, order, locators, and segment count
  are immutable; reviewed text must be non-empty.
- Cert Prep owns pending-session lifecycle and durable persistence. The browser
  sends only capture identity and text overrides on confirmation.
- Pending capture sessions expire after 30 minutes and are cleaned on backend
  startup/shutdown. Sidecar credentials remain backend-only.
