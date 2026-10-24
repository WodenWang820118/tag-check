import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, Subject, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReportDetailResponse } from '@utils';
import {
  RunTestOptions,
  TestRunningFacadeService
} from '../../../../shared/services/facade/test-running-facade.service';
import { BatchRunService } from './batch-run.service';

const STORAGE_KEY = 'tag-check.batch-run';

/** The JSON the run endpoint returns for a finished run (dates are strings). */
function reportJson(
  eventName: string,
  passed: boolean,
  requestPassed: boolean
): ReportDetailResponse {
  return JSON.parse(
    JSON.stringify({
      testEvent: {
        id: 1,
        eventId: `id-${eventName}`,
        testName: eventName,
        eventName,
        message: 'Valid',
        lastRunAt: '2026-10-23T12:00:00.000Z',
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-23T12:00:00.000Z'
      },
      testEventDetails: {
        id: 7,
        passed,
        requestPassed,
        rawRequest: '',
        destinationUrl: 'https://ng-gtm-sample.vercel.app/home',
        message: 'Valid',
        createdAt: '2026-10-23T12:00:00.000Z',
        updatedAt: '2026-10-23T12:00:00.000Z'
      },
      testImage: null
    })
  ) as ReportDetailResponse;
}

const tests = [
  { eventId: 'id-add_to_cart', eventName: 'add_to_cart' },
  { eventId: 'id-view_item', eventName: 'view_item' },
  { eventId: 'id-purchase', eventName: 'purchase' }
];

describe('BatchRunService', () => {
  let runTestForReport: ReturnType<
    typeof vi.fn<
      (
        eventId: string,
        projectSlug: string,
        options?: RunTestOptions
      ) => Observable<ReportDetailResponse | undefined>
    >
  >;
  let stopOperation: ReturnType<typeof vi.fn<() => Observable<unknown>>>;
  let isRunningTest: WritableSignal<boolean>;

  function createService(): BatchRunService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TestRunningFacadeService,
          useValue: {
            runTestForReport,
            stopOperation,
            isRunningTest$: isRunningTest.asReadonly()
          }
        }
      ]
    });
    return TestBed.inject(BatchRunService);
  }

  beforeEach(() => {
    localStorage.clear();
    runTestForReport = vi.fn();
    stopOperation = vi.fn(() => of(null));
    isRunningTest = signal(false);
  });

  afterEach(() => localStorage.clear());

  it('runs the tests one after another, closing each browser, and records each outcome', async () => {
    const order: string[] = [];
    runTestForReport.mockImplementation((eventId) => {
      order.push(eventId);
      const outcomes: Record<string, ReportDetailResponse> = {
        'id-add_to_cart': reportJson('add_to_cart', true, true),
        'id-view_item': reportJson('view_item', true, false),
        'id-purchase': reportJson('purchase', false, false)
      };
      return of(outcomes[eventId]);
    });
    const service = createService();

    await service.start('example-project-slug', tests);

    expect(order).toEqual(['id-add_to_cart', 'id-view_item', 'id-purchase']);
    expect(runTestForReport).toHaveBeenCalledWith(
      'id-add_to_cart',
      'example-project-slug',
      { closeBrowser: true }
    );
    expect(service.batch()?.items.map((item) => item.status)).toEqual([
      'passed',
      'partial',
      'failed'
    ]);
    expect(service.doneCount()).toBe(3);
    expect(service.isRunning()).toBe(false);
    expect(service.batch()?.finishedAt).toEqual(expect.any(String));
  });

  it('records why a run ended in error and goes on with the next test', async () => {
    runTestForReport.mockImplementation((eventId) =>
      eventId === 'id-add_to_cart'
        ? throwError(
            () =>
              new HttpErrorResponse({
                status: 500,
                error: { statusCode: 500, message: 'No recording found' }
              })
          )
        : of(
            eventId === 'id-view_item'
              ? undefined
              : reportJson('purchase', true, true)
          )
    );
    const service = createService();

    await service.start('example-project-slug', tests);

    expect(service.batch()?.items).toEqual([
      expect.objectContaining({
        status: 'error',
        message: 'No recording found'
      }),
      expect.objectContaining({
        status: 'error',
        message: 'The run returned no result.'
      }),
      expect.objectContaining({ status: 'passed' })
    ]);
  });

  it("shows the API's reason when a run service wraps the failed response", async () => {
    runTestForReport.mockReturnValueOnce(
      throwError(
        () =>
          new Error('GTM inspection failed', {
            cause: new HttpErrorResponse({
              status: 500,
              error: { statusCode: 500, message: 'No recording found' }
            })
          })
      )
    );
    runTestForReport.mockReturnValueOnce(
      throwError(() => new Error('GTM inspection failed'))
    );
    const service = createService();

    await service.start('example-project-slug', tests.slice(0, 2));

    expect(service.batch()?.items.map((item) => item.message)).toEqual([
      'No recording found',
      'GTM inspection failed'
    ]);
  });

  it('stops the running test and skips the rest when cancelled', async () => {
    const firstRun = new Subject<ReportDetailResponse>();
    runTestForReport.mockReturnValueOnce(firstRun);
    const service = createService();

    const running = service.start('example-project-slug', tests);
    expect(service.currentItem()?.eventName).toBe('add_to_cart');
    await service.cancel();
    firstRun.error(new Error('Operation aborted'));
    await running;

    expect(stopOperation).toHaveBeenCalledOnce();
    expect(runTestForReport).toHaveBeenCalledOnce();
    expect(service.batch()?.items.map((item) => item.status)).toEqual([
      'cancelled',
      'cancelled',
      'cancelled'
    ]);
  });

  it('marks the stopped test cancelled when its run returns no result', async () => {
    // A run service answers a run the user stopped with an empty result.
    const firstRun = new Subject<ReportDetailResponse | undefined>();
    runTestForReport.mockReturnValueOnce(firstRun);
    const service = createService();

    const running = service.start('example-project-slug', tests);
    await service.cancel();
    firstRun.next(undefined);
    firstRun.complete();
    await running;

    expect(service.batch()?.items).toEqual([
      expect.objectContaining({ status: 'cancelled', message: undefined }),
      expect.objectContaining({ status: 'cancelled' }),
      expect.objectContaining({ status: 'cancelled' })
    ]);
  });

  it('does not start or resume a batch while a single test runs', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        projectSlug: 'example-project-slug',
        startedAt: '2026-10-23T12:00:00.000Z',
        items: [
          { eventId: 'id-view_item', eventName: 'view_item', status: 'pending' }
        ]
      })
    );
    isRunningTest.set(true);
    const service = createService();

    expect(service.canResume()).toBe(false);
    await service.resume();
    await service.start('example-project-slug', tests);

    expect(runTestForReport).not.toHaveBeenCalled();
    expect(service.batch()?.items).toHaveLength(1);

    isRunningTest.set(false);
    expect(service.canResume()).toBe(true);
  });

  it('ignores a second start while a batch is running', async () => {
    const firstRun = new Subject<ReportDetailResponse>();
    runTestForReport.mockReturnValueOnce(firstRun);
    runTestForReport.mockReturnValue(of(reportJson('view_item', true, true)));
    const service = createService();

    const running = service.start('example-project-slug', tests);
    await service.start('other-project', [tests[2]]);
    firstRun.next(reportJson('add_to_cart', true, true));
    firstRun.complete();
    await running;

    expect(service.batch()?.projectSlug).toBe('example-project-slug');
    expect(service.batch()?.items).toHaveLength(3);
  });

  it('resumes the tests a reload interrupted, treating the running one as pending', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        projectSlug: 'example-project-slug',
        startedAt: '2026-10-23T12:00:00.000Z',
        items: [
          {
            eventId: 'id-add_to_cart',
            eventName: 'add_to_cart',
            status: 'passed'
          },
          {
            eventId: 'id-view_item',
            eventName: 'view_item',
            status: 'running'
          },
          { eventId: 'id-purchase', eventName: 'purchase', status: 'pending' }
        ]
      })
    );
    runTestForReport.mockReturnValue(of(reportJson('view_item', true, true)));
    const service = createService();

    expect(service.canResume()).toBe(true);
    await service.resume();

    expect(runTestForReport.mock.calls.map(([eventId]) => eventId)).toEqual([
      'id-view_item',
      'id-purchase'
    ]);
    expect(service.canResume()).toBe(false);
    const stored: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '{}'
    );
    expect(stored).toEqual(
      expect.objectContaining({
        items: [
          expect.objectContaining({ status: 'passed' }),
          expect.objectContaining({ status: 'passed' }),
          expect.objectContaining({ status: 'passed' })
        ]
      })
    );
  });

  it('ignores stored data that is not a batch, and clears a finished batch', async () => {
    localStorage.setItem(STORAGE_KEY, '{"items":[{"eventId":1}]}');
    expect(createService().batch()).toBeNull();

    runTestForReport.mockReturnValue(of(reportJson('add_to_cart', true, true)));
    const service = createService();
    await service.start('example-project-slug', [tests[0]]);
    service.clear();

    expect(service.batch()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
