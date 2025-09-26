export interface ProjectImportProvider {
  /**
   * Import previously exported project data. Should validate structure & version.
   */
  importProject(payload: unknown): Promise<void>;
}
