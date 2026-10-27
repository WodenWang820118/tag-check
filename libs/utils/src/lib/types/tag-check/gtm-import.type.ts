/** Outcome of importing a Tag Manager container export into a project. */
export interface GtmImportSummary {
  saved: true;
  /** Tag names that became new test events. */
  created: string[];
  /** Existing test events whose generated spec was refreshed from the container. */
  updated: string[];
  /** Existing test events left as they were: their spec was edited or is already current. */
  unchanged: string[];
  /**
   * Tests whose event name was changed to the container's. The test name,
   * recording and runs stay; the spec is replaced because the event changed.
   */
  renamed: string[];
  /**
   * Tags the user kept alongside the existing test. `tagName` is the existing
   * test; `testName` is the new test, with a numeric suffix so names stay unique.
   */
  keptBoth: { tagName: string; testName: string }[];
  /** Tags that were not imported, with the reason. */
  skipped: { tagName: string; reason: string }[];
}

/**
 * A tag name that already belongs to a test, whose GA4 event name in the
 * container is different. The import asks before it changes that test.
 */
export interface GtmImportConflict {
  /** The tag name, which is the existing test's name. */
  tagName: string;
  existingEventName: string;
  newEventName: string;
  /**
   * True when the existing spec was edited. Updating still replaces it,
   * because the event name changed.
   */
  specEdited: boolean;
}

/** What to do with one test whose tag name matches and whose event name changed. */
export type GtmImportResolution = 'update' | 'keepBoth';

/**
 * Conflicts a dry-run import would ask about. The preview writes no rows,
 * files or container.
 */
export interface GtmImportPreview {
  conflicts: GtmImportConflict[];
}
