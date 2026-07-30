# Decision: DirectML-first OCR on the cert-prep iGPU route

## Decision

Use `onnxruntime-directml==1.24.4` for Windows OCR and Whisper's Windows extra. Remove the
generic `onnxruntime` dependency pulled by `faster-whisper==1.2.1` with a scoped uv dependency
exclusion so two distributions cannot overwrite the `onnxruntime` Python namespace.

OCR selects DirectML adapter `0` by default, preserving `CAPTURE_WINDOWSML_DEVICE_ID` as the
explicit override. This matches cert-prep's AMD Radeon 880M iGPU route without adding device-name
detection or automatic GPU selection.

Production environment preparation explicitly reinstalls `onnxruntime-directml` after uv's exact
sync. ORT distributions overwrite the same Python namespace, so an existing checkout can retain
DirectML distribution metadata while another ORT uninstall removes its import files. The
production build therefore verifies sole distribution ownership and registered providers, then
runs PyInstaller without another implicit sync. Release schema generation depends on the same
verified environment and also uses `uv run --no-sync`; no ordinary uv sync may run in parallel
with the production packaging chain.

## Consequences

The absence of `DmlExecutionProvider` is the only condition that selects a CPU-only OCR pipeline.
When DML is available, the single DML-first session still registers `CPUExecutionProvider` second
for unsupported kernels. A registered DML provider whose session cannot initialize or execute is
an extraction error; the runtime does not create a second CPU-only pipeline. This makes
provider/driver regressions visible without misrepresenting ONNX Runtime's per-kernel fallback.
OCR provenance remains compatible: `windowsml-ocr`, `windowsml-dml`, and `cpu` are retained, with
`windowsml-dml` meaning DML-first session configuration rather than an every-operator GPU claim.
