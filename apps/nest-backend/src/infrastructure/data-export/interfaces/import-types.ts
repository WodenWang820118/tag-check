/** Rows of one entity that an import inserted (or merged) and skipped. */
export interface ImportStats {
  inserted: number;
  skipped: number;
}

/**
 * A pointer from an imported row to a row of an entity that is imported
 * later, such as a test's latest result. It is left out when the row is
 * inserted and set once the target's new id is known.
 */
export interface DeferredPointer {
  /** The entity of the row that holds the pointer. */
  entityName: string;
  /** The exported primary key of that row. */
  exportedRowId: unknown;
  /** The relation property, such as `latestTestEventDetail`. */
  relationProp: string;
  /** The entity the pointer targets. */
  targetEntityName: string;
  /** The target's primary key in the exported data. */
  exportedTargetId: unknown;
}

/** State shared by the steps of one import. */
export interface ImportRuntimeContext {
  exportedProjectId: unknown;
  newProjectId: unknown;
  stats: Record<string, ImportStats>;
  /** Entity name -> exported primary key -> primary key in this database. */
  idMaps: Record<string, Map<unknown, unknown>>;
  /**
   * Entities of the envelope whose rows are not imported yet. A pointer to
   * one of them is deferred. When absent, nothing is deferred.
   */
  pendingEntities?: Set<string>;
  /** Pointers to set after every entity is imported. */
  deferredPointers?: DeferredPointer[];
}
