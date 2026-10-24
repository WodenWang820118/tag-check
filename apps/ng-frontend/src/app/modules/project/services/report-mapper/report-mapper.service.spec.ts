import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ReportMapperService } from './report-mapper.service';
import { REPORT_LIST_ITEM_SAMPLE, type AbstractTestEvent } from '@utils';
import {
  getLastRunAt,
  getRunStatus
} from '../../components/report-detail.contracts';

// One item of GET /reports/:projectSlug as it arrives over HTTP.
function listItem(overrides: Record<string, unknown> = {}): AbstractTestEvent {
  return JSON.parse(
    JSON.stringify({ ...REPORT_LIST_ITEM_SAMPLE, ...overrides })
  ) as AbstractTestEvent;
}

describe('ReportMapperService', () => {
  let svc: ReportMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(ReportMapperService);
  });

  it('returns an empty array for an empty input', () => {
    expect(svc.toReportDetails([])).toEqual([]);
  });

  // Recorded from GET /reports/:projectSlug (AbstractTestEventResponseDto):
  // the latest result is flattened onto the test, with no nested detail.
  // Reading only latestTestEventDetail turned every row Failed, with no
  // recording, after a GTM or GA4 import refreshed the table.
  it('reads the flattened result the reports list sends', () => {
    const ev = listItem();

    const [out] = svc.toReportDetails([ev]);
    expect(out.passed).toBe(true);
    expect(out.requestPassed).toBe(true);
    expect(out.hasRecording).toBe(true);
    expect(out.updatedAt?.toISOString()).toBe(
      REPORT_LIST_ITEM_SAMPLE.updatedAt
    );
  });

  it('marks a test without a recording', () => {
    const ev = listItem({
      hasRecording: false,
      passed: false,
      requestPassed: false
    });

    const [out] = svc.toReportDetails([ev]);
    expect(out.hasRecording).toBe(false);
    expect(out.passed).toBe(false);
  });

  it('keeps lastRunAt, so a test whose runs were deleted shows Not run', () => {
    const [ran, deleted] = svc.toReportDetails([
      listItem(),
      listItem({ passed: false, requestPassed: false, lastRunAt: null })
    ]);

    expect(getRunStatus(ran)).toBe('passed');
    expect(getLastRunAt(ran)).toBe(REPORT_LIST_ITEM_SAMPLE.lastRunAt);
    // updatedAt is after createdAt, but the test has no run left.
    expect(getRunStatus(deleted)).toBe('notRun');
  });

  it('maps fields and uses the event-level updatedAt when present', () => {
    const ev: AbstractTestEvent = {
      eventName: 'page_view',
      testName: 'home',
      eventId: 'e1',
      stopNavigation: true,
      message: 'ok',
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-03T00:00:00.000Z',
      latestTestEventDetail: {
        passed: true,
        requestPassed: true,
        rawRequest: { url: 'http://x' },
        destinationUrl: 'http://x',
        dataLayer: [{ event: 'page_view' }],
        updatedAt: '2024-01-04T00:00:00.000Z'
      }
    } as never;

    const [out] = svc.toReportDetails([ev]);
    expect(out.position).toBe(1);
    expect(out.event).toBe('page_view');
    expect(out.eventId).toBe('e1');
    expect(out.passed).toBe(true);
    expect(out.requestPassed).toBe(true);
    expect(out.destinationUrl).toBe('http://x');
    expect(out.updatedAt?.toISOString()).toBe('2024-01-03T00:00:00.000Z');
    expect(out.createdAt?.toISOString()).toBe('2024-01-02T00:00:00.000Z');
  });

  it('falls back to detail.updatedAt when event has none', () => {
    const ev = {
      eventName: 'e',
      testName: 't',
      eventId: 'i',
      stopNavigation: false,
      message: '',
      latestTestEventDetail: {
        passed: false,
        requestPassed: false,
        updatedAt: '2024-01-04T00:00:00.000Z'
      }
    } as never;
    const [out] = svc.toReportDetails([ev]);
    expect(out.updatedAt?.toISOString()).toBe('2024-01-04T00:00:00.000Z');
  });

  it('falls back to "now" when neither event nor detail provides timestamps', () => {
    const ev = {
      eventName: 'e',
      testName: 't',
      eventId: 'i',
      stopNavigation: false,
      message: ''
    } as never;
    const [out] = svc.toReportDetails([ev]);
    expect(out.updatedAt instanceof Date).toBe(true);
    expect(out.createdAt instanceof Date).toBe(true);
    expect(out.passed).toBe(false);
    expect(out.requestPassed).toBe(false);
    expect(out.destinationUrl).toBe('');
  });

  it('assigns 1-based positions to entries', () => {
    const items = [
      {
        eventName: 'a',
        testName: 't',
        eventId: '1',
        stopNavigation: false,
        message: ''
      },
      {
        eventName: 'b',
        testName: 't',
        eventId: '2',
        stopNavigation: false,
        message: ''
      }
    ] as never[];
    const out = svc.toReportDetails(items);
    expect(out.map((r) => r.position)).toEqual([1, 2]);
  });
});
