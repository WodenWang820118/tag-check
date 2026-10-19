/** Outcome of importing a Tag Manager container export into a project. */
export interface GtmImportSummary {
  saved: true;
  /** Tag names that became new test events. */
  created: string[];
  /** Existing test events whose generated spec was refreshed from the container. */
  updated: string[];
  /** Existing test events left as they were: their spec was edited or is already current. */
  unchanged: string[];
  /** Tags that were not imported, with the reason. */
  skipped: { tagName: string; reason: string }[];
}
