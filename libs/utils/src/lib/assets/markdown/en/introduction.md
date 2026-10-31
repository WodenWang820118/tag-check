# Introduction

TagCheck checks that a Google Tag Manager (GTM) setup sends the data you planned. It replays a user journey in Chrome, captures every `dataLayer` push and the GA4 request for the event, and compares both with a spec: the event and the parameters you expect.

## How TagCheck is organized

- **Project**: one website under test, with its settings: the values to load before each run (such as consent cookies), sign-in details, the GTM preview link and browser options.
- **Test**: one GA4 event to check. A test has a **spec**, the `dataLayer` push it expects, and a **recording**, the Chrome Recorder journey that makes the event happen.
- **Run**: one replay of a test's recording. Each run makes two checks:
  - the **data layer check**: the event pushed to `dataLayer` matches the spec;
  - the **request check**: a GA4 request for the event was sent to the project's measurement ID, and its parameters match the spec.
- **Result**: what a run found: both checks, the captured `dataLayer`, the raw request, a screenshot and a screen recording.
- **Status**: each test shows the status of its latest run: **Passed** when both checks passed, **Partial** when one did, **Failed** when neither did, and **Not run** before the first run. A run made without the request check (Request Check off) is Passed or Failed by its data layer check alone.

## What happens during a run

1. TagCheck opens Chrome with Puppeteer, loads the project's pre-loading values and replays the test's recording.
2. It records every `dataLayer` push and intercepts the GA4 requests the page sends.
3. It compares the event and the request with the spec, saves the result with a screenshot and a screen recording, and updates the test's status.

In Accompanied Mode, the run opens the site through GTM Preview (Tag Assistant), so you can also watch the tags fire in an unpublished workspace.

## In this documentation

- **Objective**: what the two checks catch.
- **Use cases**: when TagCheck helps.
- **Getting started**: create a project, add tests and run them.
- **Quality assurance**: write specs and read the checks.
- **Report management**: results, the Reports page and spreadsheets.
- **Setting details**: every project setting.
