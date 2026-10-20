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

export type RunStatus = 'notRun' | 'passed' | 'partial' | 'failed';

/**
 * A test has run once its detail was updated after it was created. It passes
 * when both the data layer and the request check passed, and is partial when
 * only one did.
 */
export function getRunStatus(
  report:
    | Pick<
        IReportDetails,
        'createdAt' | 'updatedAt' | 'passed' | 'requestPassed'
      >
    | undefined
): RunStatus {
  const updated = report?.updatedAt ? new Date(report.updatedAt).getTime() : 0;
  const created = report?.createdAt ? new Date(report.createdAt).getTime() : 0;
  if (!report || updated <= created) {
    return 'notRun';
  }
  const dataLayerPassed = report.passed === true;
  const requestPassed = report.requestPassed === true;
  if (dataLayerPassed && requestPassed) {
    return 'passed';
  }
  return dataLayerPassed || requestPassed ? 'partial' : 'failed';
}

export type ReportTabViewModel = {
  title: string;
  lastRunAt: Date | string | undefined;
  status: RunStatus;
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
