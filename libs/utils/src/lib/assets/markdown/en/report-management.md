# Report management

Every run saves a result. A test's page shows its latest run and any earlier one, and the **Reports** page lists every run of the project and exports spreadsheets.

## A test's page

Open a test from the **Tests** page. Its page shows the latest run:

- **Header**: the event name (select it to copy it), the run's number and when it ran. **Run again** runs the test and shows the new run. **Export** saves the run as a spreadsheet (XLSX), its site recording (WEBM), or both. **All runs** opens the Reports page filtered to this event.
- **Checks**: the data layer check says whether the site pushed the event with every key the spec requires, or why not. The request check says whether GA4 received the event at the measurement ID. **History** shows the test's last 20 runs, oldest first; select one to open it. An earlier run shows a banner with **Go to the latest run**.
- **What happened**: the site recording and, for runs in Accompanied Mode, the Tag Assistant recording, playing together on one timeline. The timeline marks each recorded step, and the steps are listed below it; select a step to play from just before it. A run without a screen recording shows its screenshot.
- **Expected vs captured**: each key of the spec next to the value the run captured, and the result. Keys the site pushed that the spec does not mention are under **Captured, not in the spec**.
- **GA4 request**: the captured request as GA4 reads it: event, measurement ID, event parameters, items and page. **Copy raw URL** copies the request. Without a request, **Where to look** lists what to check.
- **Tag configuration**: the event's tag and variables in the project's GTM container.
- **Spec, recording and item definition**:
  - **Data Layer Spec**: the spec the run compared against; editable.
  - **Chrome Recording**: the journey the run replayed; editable.
  - **Raw Request**: the GA4 request the run captured.
  - **Data Layer**: every `dataLayer` push the run captured.
  - **Item Definition**: a GA4 item the test expects in `ecommerce.items`, if any; editable. **Quality assurance** explains how runs use it.

## The Reports page

**Reports** lists every run of the project's tests, newest first, with its status and when it ran. Filter the list by event name, and select runs to act on them:

- **Download** exports a spreadsheet with one sheet per selected test. Each sheet shows the spec; every run's captured data layer, checks, raw request and destination URL; the latest run's status and message; the recording's steps; and the latest screenshot.
- **Delete** deletes the selected runs with the screenshots and screen recordings they saved. The tests stay. A test whose latest run is deleted shows its previous run, and Not run when no run is left. The latest 10 runs of a test keep their screen recordings; older runs keep their screenshot.
