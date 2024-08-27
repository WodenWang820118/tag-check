export interface FileReport {
  name: string;
  path: string;
  position: number;
  lastModified: Date;
  dataLayerState: boolean;
  requestState: boolean;
}
