export interface ProjectExportProvider {
  /**
   * Export a single project's data into a JSON serializable object (NOT yet stringified)
   * Implementations should be deterministic and side-effect free.
   */
  exportProject(projectSlug: string): Promise<unknown>;
}
