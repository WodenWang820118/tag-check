import { MessageEvent } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import type { RunStatusTest } from '@utils';
import { ProgressEventsService } from './progress-events.service';
import { RunStatusService } from './run-status.service';
import { STATUS_LINE_PREFIX } from './status-line';

const TEST: RunStatusTest = {
  projectSlug: 'shop',
  eventId: 'evt-1',
  eventName: 'add_to_cart',
  testName: 'Add to cart'
};

function setUp(options: { stdout?: boolean } = {}) {
  const progress = new ProgressEventsService();
  const events: MessageEvent[] = [];
  progress.events$.subscribe((event) => events.push(event));
  const lines: string[] = [];
  const service = new RunStatusService(
    progress,
    options.stdout ? (line: string) => lines.push(line) : null
  );
  return { service, events, lines };
}

/** The events of one type, without their retry. */
function dataOf(events: MessageEvent[], type: string): unknown[] {
  return events.filter((event) => event.type === type).map((e) => e.data);
}

describe('RunStatusService', () => {
  it('starts idle', () => {
    expect(setUp().service.current).toEqual({ state: 'idle' });
  });

  it('moves from starting to running to idle and sends each change', () => {
    const { service, events } = setUp();

    service.start(TEST);
    expect(service.current).toEqual({ state: 'starting', ...TEST });
    service.step('evt-1', 12, 1);
    service.step('evt-1', 12, 5);
    expect(service.current).toEqual({
      state: 'running',
      ...TEST,
      currentStep: 5,
      totalSteps: 12
    });
    service.finish('passed');
    expect(service.current).toEqual({ state: 'idle' });

    expect(dataOf(events, 'runStatus')).toEqual([
      { state: 'starting', ...TEST },
      { state: 'running', ...TEST, currentStep: 1, totalSteps: 12 },
      { state: 'running', ...TEST, currentStep: 5, totalSteps: 12 },
      { state: 'idle' }
    ]);
    expect(dataOf(events, 'runFinished')).toEqual([
      { ...TEST, status: 'passed', message: null }
    ]);
    // runFinished comes before the status goes back to idle.
    expect(events.map((event) => event.type).slice(-2)).toEqual([
      'runFinished',
      'runStatus'
    ]);
  });

  it('adds the eventId and eventName to progressUpdate', () => {
    const { service, events } = setUp();

    service.start(TEST);
    service.step('evt-1', 3, 2);

    expect(dataOf(events, 'progressUpdate')).toEqual([
      {
        totalSteps: 3,
        currentStep: 2,
        eventId: 'evt-1',
        eventName: 'add_to_cart'
      }
    ]);
  });

  it('sends progressUpdate but keeps its status for a test it is not running', () => {
    const { service, events } = setUp();

    service.step('other', 4, 1);
    expect(service.current).toEqual({ state: 'idle' });
    service.start(TEST);
    service.step('other', 4, 2);
    expect(service.current).toEqual({ state: 'starting', ...TEST });

    expect(dataOf(events, 'progressUpdate')).toEqual([
      { totalSteps: 4, currentStep: 1, eventId: 'other' },
      { totalSteps: 4, currentStep: 2, eventId: 'other' }
    ]);
  });

  it("keeps a batch run's place in its batch through every change", () => {
    const { service, events } = setUp();
    const batch = {
      batchId: 7,
      position: 1,
      total: 2,
      source: 'schedule' as const
    };

    service.start({ ...TEST, batch });
    service.step('evt-1', 2, 1);
    service.finish('error', 'net::ERR_NAME_NOT_RESOLVED');

    expect(dataOf(events, 'runStatus')).toEqual([
      { state: 'starting', ...TEST, batch },
      { state: 'running', ...TEST, batch, currentStep: 1, totalSteps: 2 },
      { state: 'idle' }
    ]);
    expect(dataOf(events, 'runFinished')).toEqual([
      {
        ...TEST,
        batch,
        status: 'error',
        message: 'net::ERR_NAME_NOT_RESOLVED'
      }
    ]);
  });

  it('ignores a finish without a run in progress', () => {
    const { service, events } = setUp();

    service.finish('cancelled');

    expect(events).toEqual([]);
  });

  it('sends batchFinished', () => {
    const { service, events } = setUp();
    const payload = {
      batchId: 3,
      projectSlug: 'shop',
      source: 'manual' as const,
      status: 'cancelled' as const,
      total: 3,
      passed: 1,
      partial: 0,
      failed: 0,
      error: 0,
      cancelled: 2
    };

    service.finishBatch(payload);

    expect(events).toEqual([
      { type: 'batchFinished', data: payload, retry: 1000 }
    ]);
  });

  it('writes every message as one stdout line when the desktop app asks', () => {
    const { service, lines } = setUp({ stdout: true });

    service.start(TEST);
    service.step('evt-1', 2, 1);
    service.finish('partial');

    expect(lines).toHaveLength(4);
    for (const line of lines) {
      expect(line.startsWith(STATUS_LINE_PREFIX)).toBe(true);
      expect(line.indexOf('\n')).toBe(line.length - 1);
    }
    expect(
      lines.map((line) => JSON.parse(line.slice(STATUS_LINE_PREFIX.length)))
    ).toEqual([
      { type: 'runStatus', data: { state: 'starting', ...TEST } },
      {
        type: 'runStatus',
        data: { state: 'running', ...TEST, currentStep: 1, totalSteps: 2 }
      },
      {
        type: 'runFinished',
        data: { ...TEST, status: 'partial', message: null }
      },
      { type: 'runStatus', data: { state: 'idle' } }
    ]);
  });

  it('writes nothing to stdout without a writer', () => {
    const { service, lines, events } = setUp({ stdout: false });

    service.start(TEST);
    service.finish('passed');

    expect(lines).toEqual([]);
    expect(events).toHaveLength(3);
  });
});
