# DirectML-first OCR without a CPU-only retry

## Scope

PDF and image OCR in `capture-runtime` use ONNX Runtime DirectML first on Windows. Audio
Whisper, Ollama, `CaptureEngineV1`, `/v1`, and the Angular package contract are unchanged.

## Provider policy

- `DmlExecutionProvider` is the GPU capability signal.
- When DML is registered, OCR creates one DML-first ONNX pipeline with
  `device_id=CAPTURE_WINDOWSML_DEVICE_ID`, sequential execution, and memory pattern disabled.
  `CPUExecutionProvider` remains the secondary provider in that same session so ONNX Runtime can
  execute kernels that DirectML does not support.
- When DML is not registered but `CPUExecutionProvider` is registered, OCR creates a CPU-only
  pipeline and reports a warning.
- When DML initialization or inference fails after DML is registered, the capture fails. It does
  not create or retry a separate CPU-only pipeline.
- If neither DML nor CPU is registered, the OCR requirement is unavailable.

## Adapter selection

The default DirectML adapter is index `0`, matching cert-prep's published-sidecar evidence for
`AMD Radeon(TM) 880M Graphics` (`amd_igpu`). The runtime does not auto-select a GPU by name and
does not route OCR through Whisper's CUDA device. Hosts may explicitly override the adapter with
`CAPTURE_WINDOWSML_DEVICE_ID`.

## User-visible provenance

`CaptureDocumentV1.extractionEngine.device` remains the existing field and reports
`windowsml-dml` or `cpu`. The desktop review surface displays this value beside the OCR engine
and model. `windowsml-dml` means the OCR session was configured DML-first; it does not claim that
every operator ran on the GPU because the same session retains the CPU execution provider.

## Production environment gate

The Windows production build must run `capture-runtime:prepare-production-environment` before
packaging. That target performs an exact uv sync and reinstalls `onnxruntime-directml`, because
switching from another ORT distribution can otherwise leave distribution metadata while removing
the shared `onnxruntime` package files. `capture-runtime:verify-production-environment` then
requires DirectML to be the only ORT distribution and namespace owner, with both
`DmlExecutionProvider` and `CPUExecutionProvider` registered. PyInstaller runs with
`uv run --no-sync` only after that gate succeeds. Release schema generation shares the same
prepare/verify dependency and also uses `--no-sync`, so it cannot race an ordinary environment
sync against production packaging.

## Verification evidence

Verified on 2026-07-29 on a Windows x64 host with `AMD Radeon(TM) 880M Graphics` and an NVIDIA
discrete adapter:

- The production environment gate reported `onnxruntime-directml` `1.24.4` as the sole
  `onnxruntime` distribution and import owner, with `DmlExecutionProvider` and
  `CPUExecutionProvider` registered.
- The adapter policy tests passed for DML-first selection, CPU-only mode when DML is absent,
  no separate CPU-only retry after a DML-session failure, and missing providers; the full runtime
  suite passed 74 tests.
- `capture-runtime:build-production-executable` passed after the environment gate.
- `capture-workbench-desktop:smoke-real-desktop-ocr-directml --skip-nx-cache` passed against an
  image-only one-page PDF with no extractable embedded text. This DirectML-specific target always
  requires `windowsml-dml`; CPU provenance fails the gate. The packaged Tauri UI displayed
  non-empty raw OCR and structured output, and the isolated Ollama profile digest was preserved.
- The smoke deleted its library document, left the main library at its original seven entries,
  and left no desktop or runtime process.

An embedded-text PDF is not valid DirectML evidence because the runtime correctly reports
`pdf-embedded` and bypasses OCR. The smoke accepts both the pure `windowsml-ocr` provenance and
the `pdf-embedded+windowsml-ocr` composite used when only some PDF pages require OCR.
