# Capture Runtime Release and External Ollama Decisions

## Decision

Publish the runtime as the core Windows x64 sidecar and keep the Angular
package as an optional UI/client adapter. Add an explicit `external-ollama`
provider while preserving the current runtime-owned and host-owned modes.

## Alternatives considered

### Keep only the Angular package

Rejected as the primary delivery path because non-Angular hosts still need the
capture engine, process lifecycle, and API integration. It leaves the highest
value capability outside the reusable artifact.

### Replace the owned Ollama mode with a configurable endpoint

Rejected because it would weaken process/model ownership and make existing
desktop lifecycle guarantees ambiguous. A separate provider preserves backward
compatibility and makes installation behavior explicit.

### Publish only a Python wheel

Rejected as the first user-facing artifact because production extraction needs
Python 3.12, optional OCR/Whisper engines, and model assets. The Windows x64
executable plus manifest is the usable release artifact; the wheel remains a
developer/integration artifact.

### Decouple runtime and Angular release versions immediately

Deferred. The current release workflow intentionally validates one synchronized
version and publishes runtime assets before the exact npm tarball. Synchronizing
the current v0.3.0 release is the narrowest safe closeout; independent release
channels can be designed later with separate tags and evidence.

## Security boundary

The external endpoint and optional API key are process configuration. They are
never accepted from capture requests and the key is never embedded in a URL or
persisted as runtime job data. The runtime remains loopback-only and all `/v1`
routes remain Bearer-authenticated.
