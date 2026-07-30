# Capture Runtime Release and External Ollama Spec

## Purpose

Make `capture-runtime` a publishable and usable v0.3.0 Windows x64 sidecar for
non-Angular host applications. A host may use the existing runtime-owned Ollama
mode, delegate structuring to its own provider, or explicitly configure an
external Ollama endpoint while retaining runtime-owned extraction, job
lifecycle, provenance validation, and schema enforcement.

## Non-Goals

- Cross-platform production executables; v1 remains Windows 11 x64.
- A public Tauri desktop product.
- Persisting host-domain data in the runtime.
- Accepting Ollama credentials in URLs, browser requests, or logs.
- Replacing the existing runtime-owned Ollama lifecycle or host structuring mode.

## Interfaces

### Runtime provider configuration

- `CAPTURE_STRUCTURING_PROVIDER=ollama` keeps the existing isolated,
  runtime-owned Ollama process and profile.
- `CAPTURE_STRUCTURING_PROVIDER=external-ollama` uses a caller-configured
  Ollama HTTP endpoint without starting or installing Ollama.
- `CAPTURE_STRUCTURING_PROVIDER=host` keeps host-owned structuring.
- External Ollama requires:
  - `CAPTURE_OLLAMA_ENDPOINT` with an absolute HTTP(S) URL and no credentials,
    query, or fragment;
  - `CAPTURE_OLLAMA_MODEL` with the exact model name available at the endpoint;
  - optional `CAPTURE_OLLAMA_API_KEY`, held in process memory and sent only as a
    Bearer header.

### HTTP API

The existing `/v1` API and `CaptureDocumentV1` schema remain unchanged. In
external mode, runtime capabilities continue to advertise `runtime` and
`host` structuring modes, while Ollama installation requirements are disabled.
The runtime actively validates that the configured model is present at
`GET /api/tags` before generating batches through `POST /api/generate`.

### Release

- Runtime, Angular package, Tauri metadata, and protocol fixtures are
  synchronized at `0.3.0` for the existing tag-based release workflow.
- The release version checker accepts the workflow's conventional `--`
  separator and reads the canonical runtime version module.
- Runtime publication contains the executable, checksum, manifest, and schema;
  the publisher exposes the exact bytes through GitHub Release before npm
  publication.

## Key Decisions

- Use a separate `external-ollama` provider instead of weakening the ownership
  guarantees of the existing isolated Ollama provider.
- Keep endpoint validation at process startup, not per capture request, so the
  endpoint is never caller-controlled and configuration failures are explicit.
- Disable local Ollama requirement discovery and installation in external mode;
  only OCR and Whisper requirements remain runtime-owned.
- Keep remote model readiness and generation fail-closed: missing model,
  invalid digest, non-JSON response, HTTP failure, or cancellation fails the
  capture rather than producing a guessed result.

## Edge Cases and Failure Modes

- Missing or malformed external endpoint fails settings construction.
- External endpoint returns no exact model or a malformed digest: runtime
  reports provider unavailability and does not generate.
- External Ollama request cancellation cancels the in-flight HTTP request.
- External mode must reject local Ollama installation IDs with
  `requirement_disabled`.
- API authentication, loopback binding, host/origin allowlists, upload limits,
  idempotency, retention, and provenance validation remain unchanged.

## Acceptance Criteria

- `capture-runtime` lint, typecheck, tests, Python version check, and wheel build
  pass through Nx.
- A test proves external mode validates endpoint/model settings, does not expose
  Ollama installation requirements, and uses the configured Bearer API key.
- A test proves external Ollama tags and generate responses produce a validated
  `CaptureDocumentV1` and that missing model/invalid digest fail closed.
- `corepack pnpm verify:release-version -- v0.3.0` passes.
- The release artifact builder produces the canonical executable, checksum,
  manifest, and schema when supplied with a public WindowsML descriptor.
- A standalone README quick start documents environment setup, launch,
  authenticated readiness, upload, polling, and external Ollama configuration.

## Test Plan

- Unit tests for endpoint/configuration validation and external provider response
  handling using `httpx.MockTransport`.
- API contract tests for external-mode capability and requirement behavior.
- Existing full runtime pytest suite and Nx lint/typecheck/build targets.
- Local release-version and release-artifact checks without publishing or
  mutating a remote registry.
