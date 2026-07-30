# Capture Workbench Standalone Desktop Product

## Purpose

Promote the Windows Tauri host from a verification harness to the public
Capture Workbench application. The app owns its local library while the
authenticated Capture Runtime remains responsible for ephemeral extraction and
runtime-owned isolated Ollama structuring.

## Product boundary

- Windows 11 x64 only.
- The desktop host uses `CAPTURE_STRUCTURING_PROVIDER=ollama` and the existing
  isolated `qwen3.5:4b` profile; external Ollama is not a product setting.
- `@gx-capture/capture-workbench`, `/v1`, and `CaptureDocumentV1` remain
  compatible public contracts.
- The app owns saved source copies, raw diagnostics, structured results, and
  user-facing export. The runtime job is deleted after terminal data is copied.

## Desktop library contract

The host stores a versioned `library-index-v1.json` below its AppData directory
and per-document files beneath `library/items/<opaque-id>/`. Renderer IPC
accepts opaque IDs and bounded initial source bytes only. A native runtime
proxy reloads saved sources itself for processing and retry, so the renderer
never receives a local source path or the sidecar bearer token.

## Runtime requirement simplification

The WindowsML OCR bundle remains a checksum-pinned, user-consented core
requirement, but its versioned descriptor is owned by capture-runtime source.
Release builds, Tauri manifests, native launch commands, and renderer IPC do
not carry `CAPTURE_WINDOWSML_BUNDLE_*` environment variables or duplicate the
descriptor. This lets the real product development lane build from a clean
environment while retaining an explicit manual-repair state if the download or
post-install probe fails.

The current `v0.3.0` public release is missing its referenced OCR asset. This
does not block the Capture Workbench desktop artifact: the archive is neither
bundled nor required to start the app. The runtime must nevertheless retain its
consented `windowsml-ocr` installer and checksum verification. If a user asks
to install that missing asset, the setup flow must report an actionable
installation error rather than fake readiness or deterministic OCR.

## Acceptance criteria

- `pnpm run dev` follows the real release-runtime product lane. Deterministic
  development and smoke paths are explicitly named.
- A user can prepare requirements, upload, see OCR/Ollama processing, inspect
  a result, export it, reopen it from history, retry it, and delete it.
- The product UI is Traditional Chinese, keyboard accessible, and reports
  actionable setup/runtime errors.
- The desktop renderer uses Angular Material 22 with its global theme and
  animation provider loaded at bootstrap; the workbench uses Material form
  fields, buttons, cards, dividers, and progress feedback rather than an
  unused dependency.
- Product builds contain only verified release runtime assets; deterministic
  assets remain test-only.
- `pnpm run dev` and the opt-in real Ollama smoke require no WindowsML bundle
  environment variables.
