import {
  DataLayerSpec,
  FrontFileReport,
  IReportDetails,
  Recording,
  TagSpec
} from '@utils';

export type ReportDetailRouteContext = {
  projectSlug: string;
  eventId: string;
  spec: DataLayerSpec;
  recording: Recording | null;
  reportDetails: IReportDetails | undefined;
  videoBlob: Blob | undefined;
  imageBlob: Blob | undefined;
  fileReports: FrontFileReport[];
  historyLinkCommands: string[];
};

export type ReportTabViewModel = {
  title: string;
  createdAt: Date | string | undefined;
  passed: boolean;
  eventName: string;
  message: string;
  showHistory: boolean;
  showShareMenu: boolean;
  canExportSpreadsheet: boolean;
  canExportRecording: boolean;
  canExportEvent: boolean;
  hasMedia: boolean;
  videoBlob: Blob | undefined;
  imageBlob: Blob | undefined;
};

export type EditableJsonPanelState = {
  title: string;
  content: string | null;
  loading: boolean;
  emptyMessage: string;
  editMode: boolean;
  canSave: boolean;
};

export function toTagSpec(
  spec: DataLayerSpec | undefined
): TagSpec | undefined {
  if (!spec) {
    return undefined;
  }

  return {
    ...spec,
    event: spec.dataLayerSpec.event
  };
}
