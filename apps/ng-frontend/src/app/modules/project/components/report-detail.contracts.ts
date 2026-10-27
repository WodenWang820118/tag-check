import {
  DataLayerSpec,
  getCheckStatus,
  IReportDetails,
  Recording,
  ReportDetailResponse,
  RunHistoryEntry,
  RunStatus,
  StepFailureSummary,
  StepFallback,
  TagSpec,
  TestEventDetailSchema
} from '@utils';

/** Everything the report page shows, loaded by reportPageResolver. */
export type ReportDetailRouteContext = {
  projectSlug: string;
  eventId: string;
  spec: DataLayerSpec;
  recording: Recording | null;
  /** The test with the shown run's checks. */
  reportDetails: IReportDetails | undefined;
  /** The shown run: `?run=<runId>`, the latest run by default; null before the first run. */
  run: TestEventDetailSchema | null;
  /** Every run of the test, newest first. */
  runs: RunHistoryEntry[];
  /** Whether the shown run is the test's latest. */
  isLatestRun: boolean;
  /**
   * The step of the shown run that could not find its element, when the run
   * kept what it saw; null otherwise.
   */
  stepFailure: StepFailureSummary | null;
  /**
   * The steps of the shown run that continued with a fallback selector,
   * when the run kept its recordings; empty otherwise.
   */
  stepFallbacks: StepFallback[];
  videoBlob: Blob | undefined;
  /** The Tag Assistant tab of an accompanied-mode run; empty otherwise. */
  tagAssistantVideoBlob: Blob | undefined;
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
  tagAssistantVideo: { blob: Blob } | null;
  image: { blob: Blob } | null;
}): ReportDetailRouteContext {
  const run = loaded.detail?.testEventDetails ?? null;
  const runs = loaded.detail?.runs ?? [];
  return {
    projectSlug: loaded.projectSlug,
    eventId: loaded.eventId,
    spec: loaded.spec,
    recording: loaded.recording,
    reportDetails: toReportDetails(loaded.detail),
    run,
    runs,
    isLatestRun: !run || runs.length === 0 || runs[0].runId === run.id,
    stepFailure: loaded.detail?.stepFailure ?? null,
    stepFallbacks: loaded.detail?.stepFallbacks ?? [],
    videoBlob: loaded.video?.blob,
    tagAssistantVideoBlob: loaded.tagAssistantVideo?.blob,
    imageBlob: loaded.image?.blob,
    historyLinkCommands: ['..', 'buckets']
  };
}

/**
 * Whether a test has a run. The API sends lastRunAt, null once every run is
 * deleted; without it, a test has run once it was updated after it was
 * created.
 */
export function hasRun(
  report:
    | Pick<IReportDetails, 'createdAt' | 'updatedAt' | 'lastRunAt'>
    | undefined
): boolean {
  if (!report) {
    return false;
  }
  if (report.lastRunAt !== undefined) {
    return report.lastRunAt !== null;
  }
  const updated = report.updatedAt ? new Date(report.updatedAt).getTime() : 0;
  const created = report.createdAt ? new Date(report.createdAt).getTime() : 0;
  return updated > created;
}

/** When the test's latest run ran, or undefined when it has no run. */
export function getLastRunAt(
  report:
    | Pick<IReportDetails, 'createdAt' | 'updatedAt' | 'lastRunAt'>
    | undefined
): Date | string | undefined {
  if (!report || !hasRun(report)) {
    return undefined;
  }
  return report.lastRunAt ?? report.updatedAt;
}

/**
 * A test that has run passes when both the data layer and the request check
 * passed, and is partial when only one did.
 */
export function getRunStatus(
  report:
    | Pick<
        IReportDetails,
        'createdAt' | 'updatedAt' | 'lastRunAt' | 'passed' | 'requestPassed'
      >
    | undefined
): RunStatus {
  if (!report || !hasRun(report)) {
    return 'notRun';
  }
  return getCheckStatus(report.passed, report.requestPassed);
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
