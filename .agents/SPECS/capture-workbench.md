# Capture Workbench v1

## Purpose

Provide independently testable capture artifacts for Angular/Tauri hosts while
letting each product reuse its existing AI provider for mandatory structuring.

## Contracts

- Runtime binds loopback only and authenticates every exposed v1 route,
  including readiness; v1 has no unauthenticated liveness endpoint.
- Extraction produces `RawCaptureV1`; only a strictly validated provider result produces `CaptureDocumentV1`.
- Runtime mode uses the Workbench Ollama provider. Host mode exposes raw output for a host provider and accepts a validated commit.
- Original uploads are deleted at terminal state; job metadata and raw/result expire after 24 hours.
- Package and runtime perform a schema/version capability handshake.

## Non-goals

- Domain-specific certification or legal inference.
- A public Tauri desktop release in v1.
