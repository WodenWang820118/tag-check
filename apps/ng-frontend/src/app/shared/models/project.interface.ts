/**
 * Project Interface
 * @interface
 * @property {string} rootProject - The root project
 * @property {string} projectName - The project name
 * @property {string} projectSlug - The project slug, used for routing and identification
 * @property {string} testType - The test type
 * @property {string} projectDescription - The project description
 * @property {string} googleSpreadsheetLink - The google spreadsheet link
 * @property {string} tagManagerUrl - The tag manager url
 * @property {string} version - The version
 * @property {string[]} preventNavigationEvents - The prevent navigation events
 * @property {string[]} recordings - The recording names
 * @property {string[]} reports - The report names
 * @property {string[]} specs - The spec names
 */
export interface Project {
  rootProject: string;
  projectName: string;
  projectSlug: string;
  testType: string;
  projectDescription: string;
  googleSpreadsheetLink: string;
  tagManagerUrl: string;
  gtmPreviewModeUrl: string;
  version: string;
  preventNavigationEvents: string[];
  recordings: string[];
  reports: string[];
  specs: string[];
}
