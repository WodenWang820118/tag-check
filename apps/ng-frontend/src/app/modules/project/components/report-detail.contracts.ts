import {
  DataLayerSpec,
  IReportDetails,
  Recording,
  ReportDetailResponse,
  TagSpec
} from '@utils';

/** Everything the report page shows, loaded by reportPageResolver. */
export type ReportDetailRouteContext = {
  projectSlug: string;
  eventId: string;
  spec: DataLayerSpec;
  recording: Recording | null;
  reportDetails: IReportDetails | undefined;
  videoBlob: Blob | undefined;
  imageBlob: Blob | undefined;
  historyLinkCommands: string[];
};

/**
 * Flattens GET /reports/:projectSlug/:eventId into one report row. The test
 * event's timestamps win, as in the tests list: a run updates the event,
 * while each result is created at its run time.
 */
export function toReportDetails(
  response: ReportDetailResponse | null | undefined
): IReportDetails | undefined {
  if (!response?.testEvent) {
    return undefined;
  }
  const { testEvent, testEventDetails } = response;
  return {
    ...testEvent,
    passed: testEventDetails?.passed ?? testEvent.passed ?? false,
    requestPassed:
      testEventDetails?.requestPassed ?? testEvent.requestPassed ?? false,
    rawRequest: testEventDetails?.rawRequest,
    destinationUrl: testEventDetails?.destinationUrl ?? '',
    dataLayer: testEventDetails?.dataLayer,
    createdAt: testEvent.createdAt,
    updatedAt: testEvent.updatedAt,
    position: 0,
    event: testEvent.eventName
  };
}

export function buildReportPage(loaded: {
  projectSlug: string;
  eventId: string;
  detail: ReportDetailResponse | null;
  spec: DataLayerSpec;
  recording: Recording | null;
  video: { blob: Blob } | null;
  image: { blob: Blob } | null;
}): ReportDetailRouteContext {
  return {
    projectSlug: loaded.projectSlug,
    eventId: loaded.eventId,
    spec: loaded.spec,
    recording: loaded.recording,
    reportDetails: toReportDetails(loaded.detail),
    videoBlob: loaded.video?.blob,
    imageBlob: loaded.image?.blob,
    historyLinkCommands: ['..', 'buckets']
  };
}

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
  return getCheckStatus(report.passed, report.requestPassed);
}

/** The status of a run from its two checks: both, one or neither passed. */
export function getCheckStatus(
  passed: boolean | undefined,
  requestPassed: boolean | undefined
): Exclude<RunStatus, 'notRun'> {
  if (passed === true && requestPassed === true) {
    return 'passed';
  }
  return passed === true || requestPassed === true ? 'partial' : 'failed';
}

/** A status chip's label, icon and Material color. */
export type StatusBadge = {
  label: string;
  icon: string;
  color: 'primary' | 'warn' | undefined;
};

export const STATUS_BADGES: Record<RunStatus | 'running', StatusBadge> = {
  notRun: { label: 'Not run', icon: 'hourglass_empty', color: undefined },
  passed: { label: 'Passed', icon: 'check_circle', color: 'primary' },
  partial: { label: 'Partial', icon: 'error', color: 'warn' },
  failed: { label: 'Failed', icon: 'cancel', color: 'warn' },
  running: { label: 'Running', icon: 'sync', color: undefined }
};

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
