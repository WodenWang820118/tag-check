import {
  DataLayerSpec,
  REPORT_DETAIL_SAMPLE,
  ReportDetailResponse
} from '@utils';
import {
  buildReportPage,
  getRunStatus,
  toReportDetails,
  toTagSpec
} from './report-detail.contracts';

describe('toTagSpec', () => {
  it('returns undefined for an undefined spec', () => {
    expect(toTagSpec(undefined)).toBeUndefined();
  });

  it('promotes the inner dataLayerSpec.event to the top-level event field', () => {
    const spec = {
      dataLayerSpec: { event: 'page_view', extra: 'x' },
      otherKey: 'k'
    } as any;
    const result = toTagSpec(spec) as any;
    expect(result.event).toBe('page_view');
    expect(result.dataLayerSpec).toBe(spec.dataLayerSpec);
    expect(result.otherKey).toBe('k');
  });
});

describe('getRunStatus', () => {
  const created = new Date('2026-10-20T01:00:00.000Z');
  const later = new Date('2026-10-20T01:05:00.000Z');
  const report = (passed: boolean, requestPassed: boolean, updatedAt = later) =>
    ({ createdAt: created, updatedAt, passed, requestPassed }) as never;

  it('is notRun until the detail is updated after it was created', () => {
    expect(getRunStatus(report(false, false, created))).toBe('notRun');
    expect(getRunStatus(undefined)).toBe('notRun');
  });

  it('is passed, partial or failed from the two checks after a run', () => {
    expect(getRunStatus(report(true, true))).toBe('passed');
    expect(getRunStatus(report(true, false))).toBe('partial');
    expect(getRunStatus(report(false, true))).toBe('partial');
    expect(getRunStatus(report(false, false))).toBe('failed');
  });
});

// The body of GET /reports/:projectSlug/:eventId as it arrives over HTTP.
function detailResponse(
  overrides: Partial<ReportDetailResponse> = {}
): ReportDetailResponse {
  const wire = JSON.parse(
    JSON.stringify(REPORT_DETAIL_SAMPLE)
  ) as ReportDetailResponse;
  return { ...wire, ...overrides };
}

describe('toReportDetails', () => {
  it('flattens the recorded response into one report row', () => {
    const report = toReportDetails(detailResponse());

    expect(report).toMatchObject({
      eventId: REPORT_DETAIL_SAMPLE.testEvent.eventId,
      eventName: 'add_to_cart',
      event: 'add_to_cart',
      passed: true,
      requestPassed: true,
      rawRequest: REPORT_DETAIL_SAMPLE.testEventDetails.rawRequest,
      destinationUrl: REPORT_DETAIL_SAMPLE.testEventDetails.destinationUrl,
      dataLayer: REPORT_DETAIL_SAMPLE.testEventDetails.dataLayer
    });
    expect(getRunStatus(report)).toBe('passed');
  });

  it("keeps the test event's timestamps, which tell whether it has run", () => {
    const report = toReportDetails(detailResponse());

    expect(report?.createdAt).toBe(REPORT_DETAIL_SAMPLE.testEvent.createdAt);
    expect(report?.updatedAt).toBe(REPORT_DETAIL_SAMPLE.testEvent.updatedAt);
  });

  it('reads a test that has not run yet', () => {
    const notRun = detailResponse({
      testEventDetails: null,
      testImage: null
    });
    notRun.testEvent = {
      ...notRun.testEvent,
      updatedAt: notRun.testEvent.createdAt,
      passed: false,
      requestPassed: false
    };

    const report = toReportDetails(notRun);

    expect(report).toMatchObject({ passed: false, destinationUrl: '' });
    expect(report?.rawRequest).toBeUndefined();
    expect(getRunStatus(report)).toBe('notRun');
  });

  it('returns undefined without a response', () => {
    expect(toReportDetails(null)).toBeUndefined();
  });
});

describe('buildReportPage', () => {
  it('collects what the report page shows', () => {
    const video = new Blob(['webm']);
    const page = buildReportPage({
      projectSlug: 'demo',
      eventId: 'evt-1',
      detail: detailResponse(),
      spec: {} as DataLayerSpec,
      recording: null,
      video: { blob: video },
      image: null
    });

    expect(page).toMatchObject({
      projectSlug: 'demo',
      eventId: 'evt-1',
      videoBlob: video,
      imageBlob: undefined,
      historyLinkCommands: ['..', 'buckets']
    });
    expect(page.reportDetails?.eventName).toBe('add_to_cart');
  });
});
