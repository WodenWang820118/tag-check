export interface ImportStats {
  inserted: number;
  skipped: number;
}

export interface ImportRuntimeContext {
  exportedProjectId: unknown;
  newProjectId: unknown;
  stats: Record<string, ImportStats>;
  idMaps: Record<string, Map<unknown, unknown>>;
}
