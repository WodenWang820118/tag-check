# OCR Review and Cert Prep Handoff

## Purpose

Pause host-owned OCR after extraction so a user can inspect and optionally
correct page/segment text before Cert Prep structures and persists the result.

## Non-goals

- Do not change CaptureDocumentV1, its schema version, or the Capture Runtime
  sidecar API.
- Do not expose the sidecar bearer token or loopback URL to the browser.
- Do not add audio transcript review in this slice.

## Interfaces

- Capture Workbench adds an opt-in review gate and `CaptureReviewV1` edits.
- Host clients may implement `confirmCapture(captureId, request)`; the request
  contains only a review version and segment text overrides.
- Cert Prep exposes capture-review upload, status, raw, confirm, cancel, and
  result routes under `/projects/{projectId}/capture-workbench/captures`.
- A completion event carries the canonical CaptureDocumentV1 plus review edits.

## Key decisions

- Review is enabled only for host structuring and is disabled by default.
- Raw extraction remains immutable provenance. Edits preserve segment IDs,
  order, and locators and are validated against runtime raw data on the backend.
- Cert Prep stores reviewed text in `document_chunks.text` and original OCR in
  `document_chunks.raw_text`.
- Pending sessions retain a processing document without ready chunks and are
  cancelled after a 30-minute TTL or backend shutdown.

## Acceptance criteria

- OCR reaches an explicit review state before host structuring.
- Confirm sends no source file or full raw OCR payload back to the backend.
- Invalid, empty, reordered, added, or removed review segments are rejected.
- Confirmed PDF/image captures persist reviewed text while retaining raw OCR.
- Cancellation and expiry clean up the runtime capture and pending session.

## Test plan

- Angular contract/workflow/component tests for review pause, editing,
  confirmation, cancellation, and public events.
- Cert Prep backend contract tests for pending sessions, review validation,
  idempotent confirm, persistence overlay, and cleanup.
- Real PDF smoke proving OCR, review, edited confirm, ready persistence, and
  completion handoff.
