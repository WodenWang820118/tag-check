# Report management

Each report represents a test case with several related components. Reports provide a complete picture of the test case and let users review results or make changes when needed.

- Status Bar: the detail view shows a compact summary of the test status.
- Screenshot: the screenshot provides visual proof and is captured where the event is triggered or immediately after it happens.
- Video recording: the video captures the test case execution and is useful for debugging and understanding the flow.
- Dashboard: the report dashboard includes these panels:
  - Data Layer Spec
  - Chrome Recording
  - Raw Request
  - Request Data Layer
  - Data Layer

# Reports

After each successful test run, the application stores the report for review and XLSX export through the `Reports` sidebar menu. The exported report includes the information above except for the video recording, and it clearly indicates whether each test case passed or failed. Multiple reports can be downloaded at once.
