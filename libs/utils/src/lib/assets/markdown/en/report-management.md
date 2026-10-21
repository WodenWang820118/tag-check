# Report management

Every run saves a result. A test's page shows its latest result, and the **Reports** page lists every run of the project and exports spreadsheets.

## A test's latest result

Open a test from the **Tests** page and go to **Latest result**:

- **Status and last run**: the status of the latest run and when it ran. Hover over the status to see each check.
- **Message**: why the data layer check failed, such as a missing key or a value that does not match, or `Valid`.
- **Panels**:
  - **Data Layer Spec**: the spec the run compared against; editable.
  - **Chrome Recording**: the journey the run replayed; editable.
  - **Raw Request**: the GA4 request the run captured.
  - **Data Layer**: every `dataLayer` push the run captured.
  - **Item Definition**: a GA4 item the test expects in `ecommerce.items`, if any; editable. **Quality assurance** explains how runs use it.
- **Media**: the screenshot taken at the end of the run and the screen recording of the run.

The share menu exports the result as a spreadsheet (XLSX), the screen recording (WEBM), or both. The history button opens the Reports page.

## The Reports page

**Reports** lists every run of the project's tests, newest first, with its status and when it ran. Filter the list by event name, and select runs to act on them:

- **Download** exports a spreadsheet with one sheet per selected test. Each sheet shows the spec; every run's captured data layer, checks, raw request and destination URL; the latest run's status and message; the recording's steps; and the latest screenshot.
- **Delete** deletes the selected runs and the screenshots they saved. The tests stay. A test whose latest run is deleted shows its previous run, loses its screen recording, which every run replaces, and shows Not run when no run is left.
