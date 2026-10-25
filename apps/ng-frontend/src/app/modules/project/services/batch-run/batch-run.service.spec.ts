import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, Subject, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  BatchRunItemStatus,
  BatchRunStatus,
  BatchUpdatePayload,
  ReportDetailResponse
} from '@utils';
import {
  BatchRunJson,
  BatchRunsService
} from '../../../../shared/services/api/batch-runs/batch-runs.service';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';
import { ProgressEventsService } from '../../../../shared/services/progress-events/progress-events.service';
import { ReportTableDataSourceModelService } from '../report-table-data-source-model/report-table-data-source-model.service';
import { BATCH_POLL_INTERVAL_MS, BatchRunService } from './batch-run.service';

const names = ['add_to_cart', 'view_item'];

/** A batch as the batch-runs endpoints return it (dates are strings). */
function batchJson(
  id: number,
  status: BatchRunStatus,
  itemStatuses: BatchRunItemStatus[],
  overrides: { headless?: boolean; projectSlug?: string } = {}
): BatchRunJson {
  return JSON.parse(
    JSON.stringify({
      id,
      projectSlug: overrides.projectSlug ?? 'demo',
      source: 'manual',
      scheduleId: null,
      headless: overrides.headless ?? true,
      status,
      createdAt: '2026-10-25T09:00:00.000Z',
      startedAt: status === 'pending' ? null : '2026-10-25T09:00:01.000Z',
      finishedAt: null,
      items: itemStatuses.map((itemStatus, position) => ({
        id: id * 10 + position,
        eventId: `id-${names[position]}`,
        testName: names[position],
        eventName: names[position],
        position,
        status: itemStatus,
        message: itemStatus === 'cancelled' ? 'Cancelled' : null,
        startedAt: null,
        finishedAt: null,
        testEventDetailId: null
      }))
    })
  ) as BatchRunJson;
}

/** GET /reports/:projectSlug/:eventId's JSON for a finished run. */
function reportJson(eventName: string): ReportDetailResponse {
  return JSON.parse(
    JSON.stringify({
      testEvent: {
        id: 1,
        eventId: `id-${eventName}`,
        testName: eventName,
        eventName,
        message: 'Valid',
        lastRunAt: '2026-10-25T09:00:10.000Z',
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-25T09:00:10.000Z'
      },
      testEventDetails: { id: 7, passed: true, requestPassed: true },
      testImage: null
    })
  ) as ReportDetailResponse;
}

describe('BatchRunService', () => {
  let api: {
    create: ReturnType<typeof vi.fn>;
    getLatest: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
  };
  let batchUpdates: Subject<BatchUpdatePayload>;
  let release: ReturnType<typeof vi.fn>;
  let hold: ReturnType<typeof vi.fn>;
  let isRunningTest: WritableSignal<boolean>;
  let getReportDetails: ReturnType<
    typeof vi.fn<
      (projectSlug: string, eventId: string) => Observable<ReportDetailResponse>
    >
  >;
  let applyRunResult: ReturnType<typeof vi.fn>;

  function create(): BatchRunService {
    TestBed.configureTestingModule({
      providers: [
        { provide: BatchRunsService, useValue: api },
        {
          provide: ProgressEventsService,
          useValue: { batchUpdate$: batchUpdates.asObservable(), hold }
        },
        {
          provide: TestRunningFacadeService,
          useValue: { isRunningTest$: isRunningTest.asReadonly() }
        },
        { provide: ReportService, useValue: { getReportDetails } },
        {
          provide: ReportTableDataSourceModelService,
          useValue: { applyRunResult }
        }
      ]
    });
    return TestBed.inject(BatchRunService);
  }

  beforeEach(() => {
    localStorage.clear();
    api = {
      create: vi.fn(),
      getLatest: vi.fn(() => of(null)),
      get: vi.fn(),
      cancel: vi.fn()
    };
    batchUpdates = new Subject();
    release = vi.fn();
    hold = vi.fn(() => release);
    isRunningTest = signal(false);
    getReportDetails = vi.fn((_slug: string, eventId: string) =>
      of(reportJson(eventId.replace('id-', '')))
    );
    applyRunResult = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('removes the batch the frontend used to keep in localStorage', () => {
    localStorage.setItem('tag-check.batch-run', '{"items":[]}');

    create();

    expect(localStorage.getItem('tag-check.batch-run')).toBeNull();
  });

  it("shows the project's newest batch after a reload and follows it", () => {
    api.getLatest.mockReturnValue(
      of(batchJson(5, 'running', ['passed', 'running']))
    );
    const service = create();

    service.watch('demo');

    expect(api.getLatest).toHaveBeenCalledWith('demo');
    expect(hold).toHaveBeenCalledOnce();
    expect(service.isRunning()).toBe(true);
    expect(service.doneCount()).toBe(1);
    expect(service.currentItem()?.eventName).toBe('view_item');
    // The first row's result was already in the table the page just read.
    expect(getReportDetails).not.toHaveBeenCalled();

    service.unwatch();
    expect(release).toHaveBeenCalledOnce();
  });

  it('starts a batch with the headless choice and updates rows as items finish', async () => {
    api.create.mockReturnValue(
      of(batchJson(6, 'pending', ['pending', 'pending']))
    );
    const service = create();
    service.watch('demo');

    await expect(
      service.start('demo', ['id-add_to_cart', 'id-view_item'], true)
    ).resolves.toBeNull();

    expect(api.create).toHaveBeenCalledWith('demo', {
      eventIds: ['id-add_to_cart', 'id-view_item'],
      headless: true
    });
    expect(service.isRunning()).toBe(true);

    batchUpdates.next({
      batchId: 6,
      projectSlug: 'demo',
      status: 'running',
      items: [
        { eventId: 'id-add_to_cart', status: 'partial', message: null },
        { eventId: 'id-view_item', status: 'running', message: null }
      ]
    });
    // A second event with the same result does not read the row again.
    batchUpdates.next({
      batchId: 6,
      projectSlug: 'demo',
      status: 'completed',
      items: [
        { eventId: 'id-add_to_cart', status: 'partial', message: null },
        { eventId: 'id-view_item', status: 'error', message: 'No recording' }
      ]
    });

    expect(getReportDetails).toHaveBeenCalledOnce();
    expect(getReportDetails).toHaveBeenCalledWith('demo', 'id-add_to_cart');
    expect(applyRunResult).toHaveBeenCalledWith(
      'id-add_to_cart',
      reportJson('add_to_cart')
    );
    expect(service.batch()?.items.map((item) => item.message)).toEqual([
      null,
      'No recording'
    ]);
    expect(service.isRunning()).toBe(false);
  });

  it('does not start while a test started from its play button runs', async () => {
    isRunningTest.set(true);
    const service = create();

    await service.start('demo', ['id-add_to_cart'], false);

    expect(api.create).not.toHaveBeenCalled();
  });

  it("returns the API's reason when the batch cannot start", async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    api.create.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: {
              statusCode: 400,
              message: {
                message: 'Unknown tests: id-gone',
                error: 'Bad Request',
                statusCode: 400
              }
            }
          })
      )
    );
    const service = create();

    await expect(service.start('demo', ['id-gone'], false)).resolves.toBe(
      'Unknown tests: id-gone'
    );
    expect(service.isRunning()).toBe(false);
    vi.restoreAllMocks();
  });

  it('cancels the batch on the server and offers to run the rest again', async () => {
    api.getLatest.mockReturnValue(
      of(batchJson(7, 'running', ['passed', 'running']))
    );
    api.cancel.mockReturnValue(
      of(
        batchJson(7, 'cancelled', ['passed', 'cancelled'], { headless: false })
      )
    );
    api.create.mockReturnValue(of(batchJson(8, 'pending', ['pending'])));
    const service = create();
    service.watch('demo');

    await service.cancel();

    expect(api.cancel).toHaveBeenCalledWith('demo', 7);
    expect(service.isRunning()).toBe(false);
    expect(service.remainingCount()).toBe(1);
    expect(service.canResume()).toBe(true);

    await service.resume();
    expect(api.create).toHaveBeenCalledWith('demo', {
      eventIds: ['id-view_item'],
      headless: false
    });
  });

  it('polls a running batch every 3 s and ignores an answer older than an event', () => {
    vi.useFakeTimers();
    api.getLatest.mockReturnValue(
      of(batchJson(9, 'running', ['running', 'pending']))
    );
    const stale = batchJson(9, 'running', ['running', 'pending']);
    const done = batchJson(9, 'completed', ['passed', 'failed']);
    api.get.mockReturnValueOnce(of(stale)).mockReturnValueOnce(of(done));
    const service = create();
    service.watch('demo');

    batchUpdates.next({
      batchId: 9,
      projectSlug: 'demo',
      status: 'running',
      items: [
        { eventId: 'id-add_to_cart', status: 'passed', message: null },
        { eventId: 'id-view_item', status: 'running', message: null }
      ]
    });
    vi.advanceTimersByTime(BATCH_POLL_INTERVAL_MS);
    expect(api.get).toHaveBeenCalledWith('demo', 9);
    expect(service.batch()?.items[0]?.status).toBe('passed');

    vi.advanceTimersByTime(BATCH_POLL_INTERVAL_MS);
    expect(service.batch()?.status).toBe('completed');
    expect(getReportDetails.mock.calls.map(([, eventId]) => eventId)).toEqual([
      'id-add_to_cart',
      'id-view_item'
    ]);

    vi.advanceTimersByTime(BATCH_POLL_INTERVAL_MS * 3);
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it('reads a batch a schedule started, and ignores other projects', () => {
    api.get.mockReturnValue(of(batchJson(12, 'running', ['running'])));
    const service = create();
    service.watch('demo');

    batchUpdates.next({
      batchId: 30,
      projectSlug: 'other',
      status: 'running',
      items: []
    });
    batchUpdates.next({
      batchId: 12,
      projectSlug: 'demo',
      status: 'running',
      items: [{ eventId: 'id-add_to_cart', status: 'running', message: null }]
    });

    expect(api.get).toHaveBeenCalledOnce();
    expect(api.get).toHaveBeenCalledWith('demo', 12);
    expect(service.batch()?.id).toBe(12);
  });

  it('hides a cleared batch, also after a reload, until the next one', () => {
    api.getLatest.mockReturnValue(
      of(batchJson(4, 'completed', ['passed', 'failed']))
    );
    const service = create();
    service.watch('demo');
    expect(service.batch()?.id).toBe(4);

    service.clear();
    expect(service.batch()).toBeNull();

    service.watch('demo');
    expect(service.batch()).toBeNull();

    api.getLatest.mockReturnValue(of(batchJson(5, 'running', ['running'])));
    service.watch('demo');
    expect(service.batch()?.id).toBe(5);
  });
});
