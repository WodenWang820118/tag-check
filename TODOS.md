# TODOS

Planned work that has no pull request yet.

## Optional AI assistance (after 3.0.0)

Tag Check replays Chrome Recorder recordings deterministically. AI would step
in only when a run fails: to find selectors, to retry, and to record why a test
failed. The design follows [tester-army/e2e](https://github.com/tester-army/e2e),
where an agent step that passes an assertion is recorded and then replays
without model calls until the app changes.

- [ ] **Scheduled batch runs (no AI).** Running a whole project at once uses
      a lot of CPU and network, so batches run from a queue.
  - Pick a batch of tests and run it to the end, one test at a time by default.
  - Resume an interrupted batch. Keep the queue state in SQLite and report
    progress over the existing WebSocket.
  - Record each failure as structured facts:
    - the step that failed and the selectors it tried
    - timeouts, and console and network errors
    - the `dataLayer` difference from the spec
    - whether a GA4 request was sent
- [ ] **AI selector repair.**
  - When a step's selectors all time out (`waitForAnySelector` in
    `features/web-agent/action/handlers/utils.ts`), send a DOM or
    accessibility snapshot and a screenshot to the model. Ask for candidate
    selectors in Chrome Recorder's selector format.
  - Check each candidate in Puppeteer: it must exist, be unique, be visible
    and accept the action. Then rerun the test.
  - Only when both the `dataLayer` check and the request check pass, propose
    a diff of the recording JSON.
  - Write it back once the user approves it, and keep the old selectors as
    fallbacks. `RecordingRepositoryService` stores recordings, and
    `example-recordings-refresh.service.ts` already writes them back.
- [ ] **AI retry and failure records for batches.**
  - Retry unfinished or failed tests in a batch with AI help, within a
    per-batch budget.
  - Keep observed facts separate from AI inference in the failure record, and
    label inference as such.

Constraints:

- AI never decides that a test passes. The `dataLayer` and request checks do.
- AI is off by default. It works with the user's own API key or a local model,
  and limits retries and tokens per batch.
- Personal data in DOM snapshots is masked before anything is sent to a hosted
  model.
