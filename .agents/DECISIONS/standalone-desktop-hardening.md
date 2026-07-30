# Standalone Desktop Merge Hardening Decisions

- Change mode: correctness repair with private desktop-contract additions.
- Public `/v1`, `CaptureDocumentV1`, `@gx/capture-workbench`, and the native-only
  bearer-token boundary remain unchanged.
- Tauri commands that perform filesystem or runtime HTTP work are async
  wrappers. Existing synchronous library and runtime-client code runs through
  `tauri::async_runtime::spawn_blocking`; the lightweight runtime-status command
  stays synchronous.
- User cancellation is a runtime request, not an `AbortSignal` side effect.
  Each active capture sends at most one cancel request after its runtime ID is
  known. The runtime response wins completion/cancellation races and is settled
  through the normal terminal persistence path.
- The desktop library persists a runtime capture ID immediately after create.
  Terminal data moves through `persisting`; failed retrieval, local commit, or
  runtime cleanup moves to `recovery_required` without losing that ID.
- Any retained runtime ID is authoritative after restart. Nonterminal work
  queries that ID, and already-committed terminal work retries only cleanup.
- Runtime DELETE happens only after a durable terminal library commit. HTTP 404
  is idempotent cleanup success. Other cleanup failures retain the capture ID
  and a recovery action.
- Failed/canceled terminal error evidence is stored independently from recovery
  diagnostics, so a cleanup failure and later retry cannot erase provenance.
- Lifecycle fallback is phase-aware. Once terminal data is committed, nested
  cleanup/update failures can only produce cleanup-only recovery metadata; they
  cannot fall back to capture replay or discard terminal errors.
- Canceled jobs retrieve optional raw data before their durable commit and
  DELETE; only the runtime's defined no-raw response is treated as empty.
- `LibraryCaptureUpdate.clearCaptureId` is the only operation that clears a
  stored runtime ID. Omitting both capture-ID fields preserves the current ID.
- Renderer file validation is fail-fast and exactly matches the native six-MIME
  allowlist. The Rust 50 MiB validation remains the final authority.
- Native file pickers, binary/streaming IPC, store/component decomposition,
  shared smoke helpers, and typed runtime response DTOs are deferred.
