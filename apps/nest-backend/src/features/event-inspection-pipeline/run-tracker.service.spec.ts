import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { ValidationResult } from '@utils';
import type { RunStatusService } from '../../core/events-gateway/run-status.service';
import type { TestEventRepositoryService } from '../../core/repository/test-event/test-event-repository.service';
import { RunTrackerService, toRunOutcome } from './run-tracker.service';

function checks(passed: boolean, requestPassed: boolean | null) {
  const result = (ok: boolean) =>
    ({ passed: ok }) as unknown as ValidationResult;
  return [
    {
      dataLayerResult: result(passed),
      rawRequest: '',
      requestCheckResult: requestPassed === null ? null : result(requestPassed),
      destinationUrl: ''
    }
  ];
}

function setUp(found = true) {
  const runStatus = { start: vi.fn(), finish: vi.fn() };
  const testEvents = {
    getEntityBySlugAndEventId: found
      ? vi.fn().mockResolvedValue({
          eventName: 'add_to_cart',
          testName: 'Add to cart'
        })
      : vi
          .fn()
          .mockRejectedValue(
            new HttpException('Test event not found', HttpStatus.NOT_FOUND)
          )
  };
  const tracker = new RunTrackerService(
    runStatus as unknown as RunStatusService,
    testEvents as unknown as TestEventRepositoryService
  );
  return { tracker, runStatus };
}

describe('toRunOutcome', () => {
  it('reads the two checks as they are saved', () => {
    expect(toRunOutcome(checks(true, true))).toBe('passed');
    expect(toRunOutcome(checks(true, false))).toBe('partial');
    expect(toRunOutcome(checks(true, null))).toBe('partial');
    expect(toRunOutcome(checks(false, true))).toBe('partial');
    expect(toRunOutcome(checks(false, false))).toBe('failed');
  });

  it('reads a run saved as failed (no data) as failed', () => {
    expect(toRunOutcome(undefined)).toBe('failed');
    expect(toRunOutcome([])).toBe('failed');
  });
});

describe('RunTrackerService', () => {
  const run = { projectSlug: 'shop', eventId: 'evt-1' };

  it('reports the start with the test names and the end with its checks', async () => {
    const { tracker, runStatus } = setUp();
    const task = vi.fn().mockImplementation(async () => {
      expect(runStatus.start).toHaveBeenCalledWith({
        projectSlug: 'shop',
        eventId: 'evt-1',
        eventName: 'add_to_cart',
        testName: 'Add to cart'
      });
      return checks(true, true);
    });

    await expect(
      tracker.track(run, new AbortController().signal, task)
    ).resolves.toEqual(checks(true, true));
    expect(runStatus.finish).toHaveBeenCalledWith('passed');
  });

  it("keeps a batch run's place in its batch", async () => {
    const { tracker, runStatus } = setUp();
    const batch = {
      batchId: 1,
      position: 2,
      total: 3,
      source: 'manual' as const
    };

    await tracker.track(
      { ...run, batch },
      new AbortController().signal,
      async () => checks(false, false)
    );

    expect(runStatus.start).toHaveBeenCalledWith(
      expect.objectContaining({ batch })
    );
    expect(runStatus.finish).toHaveBeenCalledWith('failed');
  });

  it('reports an error with the reason the client may see, and rethrows', async () => {
    const { tracker, runStatus } = setUp();
    const error = new Error(
      'net::ERR_NAME_NOT_RESOLVED at C:\\Users\\me\\run.ts'
    );

    await expect(
      tracker.track(run, new AbortController().signal, async () => {
        throw error;
      })
    ).rejects.toBe(error);
    expect(runStatus.finish).toHaveBeenCalledWith(
      'error',
      'net::ERR_NAME_NOT_RESOLVED at <path>'
    );
  });

  it('reports a stopped run as cancelled, whether it resolves or rejects', async () => {
    const { tracker, runStatus } = setUp();
    const stopped = new AbortController();
    stopped.abort();

    await tracker.track(run, stopped.signal, async () => undefined);
    await expect(
      tracker.track(run, stopped.signal, async () => {
        throw new Error('Browser start aborted');
      })
    ).rejects.toThrow('Browser start aborted');

    expect(runStatus.finish.mock.calls).toEqual([['cancelled'], ['cancelled']]);
  });

  it('names a test it cannot read by its eventId', async () => {
    const { tracker, runStatus } = setUp(false);

    await tracker.track(
      run,
      new AbortController().signal,
      async () => undefined
    );

    expect(runStatus.start).toHaveBeenCalledWith({
      projectSlug: 'shop',
      eventId: 'evt-1',
      eventName: 'evt-1',
      testName: 'evt-1'
    });
  });
});
