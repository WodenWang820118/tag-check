# Structuring provider boundary

- `capture-runtime` owns extraction, job state, canonical validation, and result retention.
- A host may supply `CaptureStructuringProvider`; the host mode pauses at `awaiting_structuring`, then commits a candidate document for runtime validation.
- The standalone Workbench uses a runtime-owned isolated Ollama provider.
- `cert-prep` and `law-prep` reuse their existing AI providers and must not launch a second semantic provider for capture.
- Provider implementations are replaceable; `CaptureDocumentV1` is not.

## Why the boundary is split here

OCR and speech-to-text need native binaries, model installation, cancellation, and
source provenance, so those responsibilities stay in the sidecar. Semantic
structuring is already an application concern in both initial consumers. Making
it injectable prevents every host from running a second Ollama server while
keeping extraction and validation identical across products.

The host provider is not trusted to declare success. It receives an immutable
`RawCaptureV1` plus the target schema, and returns a candidate
`CaptureDocumentV1`. The runtime revalidates schema version, source digest,
locators, non-empty content, and block order before moving the job to
`completed`. Invalid provider output moves the job to `failed/structuring`; it
is never silently repaired.

## Modes

- `runtime`: the sidecar invokes its configured `CaptureStructuringProvider`.
  The verification app supplies an isolated Ollama implementation with its own
  host, model directory, profile, and owned process tree.
- `host`: extraction stops at `awaiting_structuring`. The Angular client (or a
  backend adapter) invokes the host's provider and submits the candidate to the
  sidecar validation endpoint. Provider failure is explicitly reported so the
  job reaches a terminal state.

For production hosts whose provider lives in a trusted backend, the Angular
component uses `hostStructuringOwner: 'client'`. It only polls the injected
`CaptureClient`; raw capture data, provider credentials, and sidecar credentials
do not cross into the WebView. `hostStructuringOwner: 'component'` remains the
explicit trusted-frontend option for the standalone reference app and similar
integrations.

Both modes expose the same capture status and final result contract. The only
difference is who calls the provider.

Provider adapters must plan calls against the provider context/output budget.
They may request strictly validated ordered block batches and deterministically
assemble the immutable raw provenance into one candidate; invalid, missing, or
reordered batch output is terminal and is never repaired. The completed
candidate is still accepted only by the runtime's full-document validator.

## Security and compatibility rules

- Raw capture data is available only for the job that produced it and only with
  the sidecar bearer token.
- Bearer tokens and sidecar URLs are process-scoped configuration; they do not
  belong in URLs, browser storage, persisted job records, or logs.
- Provider implementations receive data, not filesystem paths or process
  handles.
- Runtime and client perform a major-version and schema-version handshake before
  accepting work.
- A process configured for host structuring advertises only `host`, omits the
  isolated Ollama requirements, and rejects Ollama installation requests.
- Domain-specific certification or legal analysis runs after capture and is not
  part of `CaptureDocumentV1`.
