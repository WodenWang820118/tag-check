import { BadRequestException, HttpException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  BatchRunEntity,
  BatchRunItemEntity,
  TestEventEntity
} from '../../shared';
import {
  BatchQueueTestbed,
  createBatchQueueTestbed,
  seedProject
} from './batch-queue.spec-helpers';
import { CANCELLED_MESSAGE } from './batch-queue.service';

describe('BatchQueueService (SQLite)', () => {
  let bed: BatchQueueTestbed;

  beforeEach(async () => {
    bed = await createBatchQueueTestbed();
    await seedProject(bed.dataSource, 'shop', ['a', 'b', 'c']);
  });

  afterEach(async () => {
    bed.fakeRun.stopAll();
    await bed.batchQueue.whenIdle();
    await bed.moduleRef.close();
  });

  function statuses(batch: { items: { eventId: string; status: string }[] }) {
    return batch.items.map((item) => `${item.eventId}:${item.status}`);
  }

  it('runs the items in the given order and completes the batch', async () => {
    const created = await bed.batchQueue.enqueue('shop', ['c', 'a', 'b'], {
      source: 'manual',
      headless: true
    });
    expect(created).toMatchObject({
      projectSlug: 'shop',
      source: 'manual',
      scheduleId: null,
      headless: true,
      status: 'pending'
    });
    expect(created.items.map((item) => [item.eventId, item.position])).toEqual([
      ['c', 0],
      ['a', 1],
      ['b', 2]
    ]);

    await bed.batchQueue.whenIdle();

    expect(bed.fakeRun.calls).toEqual([
      { projectSlug: 'shop', eventId: 'c', headless: true },
      { projectSlug: 'shop', eventId: 'a', headless: true },
      { projectSlug: 'shop', eventId: 'b', headless: true }
    ]);
    const batch = await bed.batchQueue.get('shop', created.id);
    expect(batch.status).toBe('completed');
    expect(batch.startedAt).toBeInstanceOf(Date);
    expect(batch.finishedAt).toBeInstanceOf(Date);
    expect(statuses(batch)).toEqual(['c:passed', 'a:passed', 'b:passed']);
    for (const item of batch.items) {
      expect(item.testEventDetailId).toEqual(expect.any(Number));
      expect(item.startedAt).toBeInstanceOf(Date);
      expect(item.finishedAt).toBeInstanceOf(Date);
    }
  });

  it('runs batches first in, first out', async () => {
    const first = await bed.batchQueue.enqueue('shop', ['b', 'a'], {
      source: 'manual',
      headless: true
    });
    const second = await bed.batchQueue.enqueue('shop', ['c'], {
      source: 'manual',
      headless: false
    });
    const third = await bed.batchQueue.enqueue('shop', ['a'], {
      source: 'schedule',
      headless: true
    });

    await bed.batchQueue.whenIdle();

    expect(bed.fakeRun.calls.map((call) => call.eventId)).toEqual([
      'b',
      'a',
      'c',
      'a'
    ]);
    expect(bed.fakeRun.calls.map((call) => call.headless)).toEqual([
      true,
      true,
      false,
      true
    ]);
    for (const batch of [first, second, third]) {
      await expect(bed.batchQueue.get('shop', batch.id)).resolves.toMatchObject(
        { status: 'completed' }
      );
    }
    const list = await bed.batchQueue.list('shop', 2);
    expect(list.map((batch) => batch.id)).toEqual([third.id, second.id]);
  });

  it('maps each run to an item status and keeps the error reason', async () => {
    bed.fakeRun.behaviors.set('a', 'partial');
    bed.fakeRun.behaviors.set('b', 'failed');
    bed.fakeRun.behaviors.set('c', 'error');
    await seedProject(bed.dataSource, 'other', ['d']);
    bed.fakeRun.behaviors.set('d', 'noResult');

    const batch = await bed.batchQueue.enqueue('shop', ['a', 'b', 'c'], {
      source: 'manual',
      headless: true
    });
    const other = await bed.batchQueue.enqueue('other', ['d'], {
      source: 'manual',
      headless: true
    });
    await bed.batchQueue.whenIdle();

    const done = await bed.batchQueue.get('shop', batch.id);
    expect(done.status).toBe('completed');
    expect(
      done.items.map((item) => [item.eventId, item.status, item.message])
    ).toEqual([
      ['a', 'partial', null],
      ['b', 'failed', null],
      [
        'c',
        'error',
        'Failed to perform GTM validation: net::ERR_NAME_NOT_RESOLVED at <path>'
      ]
    ]);
    expect(done.items[2]?.testEventDetailId).toBeNull();
    const otherDone = await bed.batchQueue.get('other', other.id);
    expect(otherDone.items[0]).toMatchObject({
      status: 'error',
      message: 'The run saved no result',
      testEventDetailId: null
    });
  });

  it('uses the project browser setting when headless is not given', async () => {
    await seedProject(bed.dataSource, 'headless-shop', ['h'], {
      headless: true
    });

    const batch = await bed.batchQueue.enqueue('headless-shop', ['h'], {
      source: 'manual'
    });

    expect(batch.headless).toBe(true);
  });

  it('rejects tests the project does not have, unless asked to skip them', async () => {
    await expect(
      bed.batchQueue.enqueue('shop', ['a', 'zzz'], {
        source: 'manual',
        headless: true
      })
    ).rejects.toThrow(BadRequestException);
    await expect(bed.dataSource.manager.count(BatchRunEntity)).resolves.toBe(0);

    const skipped = await bed.batchQueue.enqueue('shop', ['zzz', 'b'], {
      source: 'schedule',
      headless: true,
      skipMissingTests: true
    });
    expect(skipped.items.map((item) => item.eventId)).toEqual(['b']);

    await expect(
      bed.batchQueue.enqueue('shop', ['zzz'], {
        source: 'schedule',
        headless: true,
        skipMissingTests: true
      })
    ).rejects.toThrow('The batch has no tests to run');
  });

  it('answers 404 for an unknown project or batch', async () => {
    await expect(
      bed.batchQueue.enqueue('nope', ['a'], { source: 'manual' })
    ).rejects.toThrow(HttpException);
    await expect(bed.batchQueue.list('nope', 20)).rejects.toThrow(
      'Project not found'
    );
    await expect(bed.batchQueue.get('shop', 999)).rejects.toThrow(
      'Batch run not found'
    );
  });

  it('cancels a batch that has not started', async () => {
    bed.fakeRun.behaviors.set('a', 'hang');
    const running = await bed.batchQueue.enqueue('shop', ['a'], {
      source: 'manual',
      headless: true
    });
    const waiting = await bed.batchQueue.enqueue('shop', ['b', 'c'], {
      source: 'manual',
      headless: true
    });
    await bed.fakeRun.started('a');

    const cancelled = await bed.batchQueue.cancel('shop', waiting.id);

    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.finishedAt).toBeInstanceOf(Date);
    expect(statuses(cancelled)).toEqual(['b:cancelled', 'c:cancelled']);
    expect(cancelled.items[0]?.message).toBe(CANCELLED_MESSAGE);
    // The running test of another batch is left alone.
    expect(bed.fakeRun.stopCount).toBe(0);

    await bed.batchQueue.cancel('shop', running.id);
    await bed.batchQueue.whenIdle();
    expect(bed.fakeRun.calls.map((call) => call.eventId)).toEqual(['a']);
  });

  it('cancels the running item, stops its run and skips the rest', async () => {
    bed.fakeRun.behaviors.set('b', 'hang');
    const batch = await bed.batchQueue.enqueue('shop', ['a', 'b', 'c'], {
      source: 'manual',
      headless: true
    });
    const next = await bed.batchQueue.enqueue('shop', ['c'], {
      source: 'manual',
      headless: true
    });
    await bed.fakeRun.started('b');

    const cancelled = await bed.batchQueue.cancel('shop', batch.id);
    await bed.batchQueue.whenIdle();

    expect(bed.fakeRun.stopCount).toBe(1);
    expect(statuses(cancelled)).toEqual([
      'a:passed',
      'b:cancelled',
      'c:cancelled'
    ]);
    // The run's failure after the stop does not overwrite the cancel.
    const after = await bed.batchQueue.get('shop', batch.id);
    expect(after.status).toBe('cancelled');
    expect(statuses(after)).toEqual(['a:passed', 'b:cancelled', 'c:cancelled']);
    expect(after.items[1]?.message).toBe(CANCELLED_MESSAGE);
    // The queue goes on with the next batch.
    await expect(bed.batchQueue.get('shop', next.id)).resolves.toMatchObject({
      status: 'completed'
    });
    expect(bed.fakeRun.calls.map((call) => call.eventId)).toEqual([
      'a',
      'b',
      'c'
    ]);
  });

  it('leaves an ended batch unchanged when it is cancelled', async () => {
    const batch = await bed.batchQueue.enqueue('shop', ['a'], {
      source: 'manual',
      headless: true
    });
    await bed.batchQueue.whenIdle();
    const updatesBefore = bed.updates.length;

    const result = await bed.batchQueue.cancel('shop', batch.id);

    expect(result.status).toBe('completed');
    expect(statuses(result)).toEqual(['a:passed']);
    expect(bed.updates).toHaveLength(updatesBefore);
    expect(bed.fakeRun.stopCount).toBe(0);
  });

  it('requeues items left running and resumes unfinished batches on restart', async () => {
    // A backend that stopped mid-run left one item running.
    const tests = await bed.dataSource.manager.find(TestEventEntity, {
      relations: { project: true },
      order: { id: 'ASC' }
    });
    const batch = await bed.dataSource.manager.save(BatchRunEntity, {
      project: tests[0]?.project,
      source: 'manual',
      scheduleId: null,
      headless: true,
      status: 'running',
      startedAt: new Date(),
      finishedAt: null
    });
    const itemStatuses = ['passed', 'running', 'pending'] as const;
    for (const [position, test] of tests.entries()) {
      await bed.dataSource.manager.save(BatchRunItemEntity, {
        batchRun: batch,
        testEvent: test,
        position,
        status: itemStatuses[position],
        message: null,
        startedAt: null,
        finishedAt: null,
        testEventDetailId: null
      });
    }

    await bed.batchQueue.onApplicationBootstrap();
    await bed.batchQueue.whenIdle();

    expect(bed.fakeRun.calls.map((call) => call.eventId)).toEqual(['b', 'c']);
    const resumed = await bed.batchQueue.get('shop', batch.id);
    expect(resumed.status).toBe('completed');
    expect(statuses(resumed)).toEqual(['a:passed', 'b:passed', 'c:passed']);
  });

  it('resumes nothing when no batch is open', async () => {
    await bed.batchQueue.resume();
    await bed.batchQueue.whenIdle();
    expect(bed.fakeRun.calls).toEqual([]);
  });

  it('stops taking items once the application shuts down', async () => {
    bed.fakeRun.behaviors.set('a', 'hang');
    const batch = await bed.batchQueue.enqueue('shop', ['a', 'b'], {
      source: 'manual',
      headless: true
    });
    await bed.fakeRun.started('a');

    bed.batchQueue.beforeApplicationShutdown();
    bed.fakeRun.stopAll();
    await bed.batchQueue.whenIdle();

    // The interrupted item stays running, to be requeued on the next start.
    const left = await bed.batchQueue.get('shop', batch.id);
    expect(left.status).toBe('running');
    expect(statuses(left)).toEqual(['a:running', 'b:pending']);
    expect(bed.fakeRun.calls.map((call) => call.eventId)).toEqual(['a']);
  });

  it('sends a batchUpdate for every change', async () => {
    const batch = await bed.batchQueue.enqueue('shop', ['a', 'b'], {
      source: 'manual',
      headless: true
    });
    await bed.batchQueue.whenIdle();

    const timeline = bed.updates.map(
      (update) =>
        `${update.status} ${update.items.map((item) => item.status).join(',')}`
    );
    expect(timeline).toEqual([
      'pending pending,pending',
      'running pending,pending',
      'running running,pending',
      'running passed,pending',
      'running passed,running',
      'running passed,passed',
      'completed passed,passed'
    ]);
    expect(bed.updates[0]).toEqual({
      batchId: batch.id,
      projectSlug: 'shop',
      status: 'pending',
      items: [
        { eventId: 'a', status: 'pending', message: null },
        { eventId: 'b', status: 'pending', message: null }
      ]
    });
  });
});
