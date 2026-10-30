import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify';
import { DataSource } from 'typeorm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { BatchRunResponse, Jsonified, ScheduleResponse } from '@utils';
import {
  batchQueueProviders,
  FakeTestRun,
  seedProject,
  sqliteImports
} from '../../features/batch-queue/batch-queue.spec-helpers';
import { BatchQueueService } from '../../features/batch-queue/batch-queue.service';
import { EventsController } from '../events/events.controller';
import { SchedulesController } from '../schedules/schedules.controller';
import { BatchRunsController } from './batch-runs.controller';

/**
 * The batch-runs and schedules routes over HTTP, on SQLite, with a fake run
 * that saves results instead of driving a browser.
 */
describe('BatchRunsController and SchedulesController (HTTP, SQLite)', () => {
  let app: NestFastifyApplication;
  let fakeRun: FakeTestRun;
  let batchQueue: BatchQueueService;

  beforeEach(async () => {
    fakeRun = new FakeTestRun();
    const moduleRef = await Test.createTestingModule({
      imports: sqliteImports(),
      controllers: [BatchRunsController, SchedulesController, EventsController],
      providers: batchQueueProviders(fakeRun)
    }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    const dataSource = moduleRef.get(DataSource);
    fakeRun.dataSource = dataSource;
    batchQueue = moduleRef.get(BatchQueueService);
    await seedProject(dataSource, 'shop', ['view_item', 'add_to_cart']);
  });

  afterEach(async () => {
    fakeRun.stopAll();
    await batchQueue?.whenIdle();
    await app?.close();
  });

  async function post(url: string, payload?: unknown) {
    return await app.inject({
      method: 'POST',
      url,
      payload: payload as object
    });
  }

  describe('/batch-runs', () => {
    it('POST creates a batch (201) that GET then shows completed', async () => {
      fakeRun.behaviors.set('add_to_cart', 'partial');

      const created = await post('/batch-runs/shop', {
        eventIds: ['add_to_cart', 'view_item'],
        headless: true
      });

      expect(created.statusCode).toBe(201);
      const body: Jsonified<BatchRunResponse> = created.json();
      expect(body).toMatchObject({
        projectSlug: 'shop',
        source: 'manual',
        scheduleId: null,
        headless: true,
        status: 'pending',
        startedAt: null,
        finishedAt: null
      });
      expect(typeof body.createdAt).toBe('string');
      expect(body.items).toEqual([
        {
          id: expect.any(Number),
          eventId: 'add_to_cart',
          testName: 'Test add_to_cart',
          eventName: 'add_to_cart',
          position: 0,
          status: 'pending',
          message: null,
          startedAt: null,
          finishedAt: null,
          testEventDetailId: null
        },
        expect.objectContaining({ eventId: 'view_item', position: 1 })
      ]);

      await batchQueue.whenIdle();
      const one = await app.inject({
        method: 'GET',
        url: `/batch-runs/shop/${body.id}`
      });
      expect(one.statusCode).toBe(200);
      const done: Jsonified<BatchRunResponse> = one.json();
      expect(done.status).toBe('completed');
      expect(done.items.map((item) => item.status)).toEqual([
        'partial',
        'passed'
      ]);
      expect(typeof done.items[0]?.testEventDetailId).toBe('number');
      expect(fakeRun.calls.map((call) => call.headless)).toEqual([true, true]);
    });

    it.each([
      [undefined, 'The body must be a JSON object'],
      [{ eventIds: [] }, 'eventIds must be a non-empty list'],
      [{ eventIds: 'view_item' }, 'eventIds must be a non-empty list'],
      [
        { eventIds: ['view_item'], headless: 'yes' },
        'headless must be true or false'
      ],
      [
        { eventIds: ['view_item', 'nope'] },
        'no tests with these eventIds: nope'
      ]
    ])('POST answers 400 for %j', async (payload, message) => {
      const response = await post('/batch-runs/shop', payload);
      expect(response.statusCode).toBe(400);
      expect(response.json().message).toContain(message);
    });

    it('POST answers 404 for an unknown project', async () => {
      const response = await post('/batch-runs/nope', {
        eventIds: ['view_item']
      });
      expect(response.statusCode).toBe(404);
    });

    it('GET lists batches newest first, up to the limit', async () => {
      const ids: number[] = [];
      for (let index = 0; index < 3; index++) {
        const created = await post('/batch-runs/shop', {
          eventIds: ['view_item'],
          headless: true
        });
        expect(created.statusCode).toBe(201);
        const body: Jsonified<BatchRunResponse> = created.json();
        ids.push(body.id);
        // The fake run saves on the same SQLite connection. Finish its
        // transaction before the next POST starts a batch transaction.
        await batchQueue.whenIdle();
      }

      const all = await app.inject({ method: 'GET', url: '/batch-runs/shop' });
      const two = await app.inject({
        method: 'GET',
        url: '/batch-runs/shop?limit=2'
      });
      const bad = await app.inject({
        method: 'GET',
        url: '/batch-runs/shop?limit=0'
      });
      const unknown = await app.inject({
        method: 'GET',
        url: '/batch-runs/nope'
      });

      expect(
        all.json().map((batch: Jsonified<BatchRunResponse>) => batch.id)
      ).toEqual([...ids].reverse());
      expect(
        two.json().map((batch: Jsonified<BatchRunResponse>) => batch.id)
      ).toEqual([ids[2], ids[1]]);
      expect(bad.statusCode).toBe(400);
      expect(unknown.statusCode).toBe(404);
    });

    it('GET answers 404 for a batch of another project and 400 for a bad id', async () => {
      await seedProject(app.get(DataSource), 'other', ['x']);
      const created = await post('/batch-runs/other', { eventIds: ['x'] });

      const wrongProject = await app.inject({
        method: 'GET',
        url: `/batch-runs/shop/${created.json().id}`
      });
      const badId = await app.inject({
        method: 'GET',
        url: '/batch-runs/shop/abc'
      });

      expect(wrongProject.statusCode).toBe(404);
      expect(badId.statusCode).toBe(400);
    });

    it('POST cancel stops the running test and cancels the rest (200)', async () => {
      fakeRun.behaviors.set('view_item', 'hang');
      const created = await post('/batch-runs/shop', {
        eventIds: ['view_item', 'add_to_cart'],
        headless: true
      });
      await fakeRun.started('view_item');

      const cancelled = await post(
        `/batch-runs/shop/${created.json().id}/cancel`
      );

      expect(cancelled.statusCode).toBe(200);
      const body: Jsonified<BatchRunResponse> = cancelled.json();
      expect(body.status).toBe('cancelled');
      expect(body.items.map((item) => [item.status, item.message])).toEqual([
        ['cancelled', 'Cancelled'],
        ['cancelled', 'Cancelled']
      ]);
      expect(fakeRun.stopCount).toBe(1);
      const missing = await post('/batch-runs/shop/999/cancel');
      expect(missing.statusCode).toBe(404);
    });
  });

  describe('/schedules', () => {
    const daily = {
      name: 'Morning',
      eventIds: ['view_item'],
      kind: 'daily',
      time: '07:30'
    };

    it('POST creates a schedule (201) that GET lists', async () => {
      const created = await post('/schedules/shop', daily);

      expect(created.statusCode).toBe(201);
      const body: Jsonified<ScheduleResponse> = created.json();
      expect(body).toMatchObject({
        projectSlug: 'shop',
        name: 'Morning',
        eventIds: ['view_item'],
        kind: 'daily',
        time: '07:30',
        weekdays: null,
        everyHours: null,
        enabled: true,
        lastRunAt: null
      });
      expect(new Date(body.nextRunAt ?? '').getHours()).toBe(7);

      const list = await app.inject({ method: 'GET', url: '/schedules/shop' });
      expect(list.statusCode).toBe(200);
      expect(list.json()).toEqual([body]);
    });

    it.each([
      [{ ...daily, time: '25:00' }, 'time must be HH:MM, from 00:00 to 23:59'],
      [
        { ...daily, kind: 'weekly', weekdays: [] },
        'weekdays must list at least one day, from 0 (Sunday) to 6'
      ],
      [
        { ...daily, kind: 'everyHours', everyHours: 48 },
        'everyHours must be a whole number from 1 to 24'
      ],
      [
        { ...daily, name: '' },
        'name must be a non-empty string of at most 255 characters'
      ],
      [
        { ...daily, eventIds: ['nope'] },
        'The project has no tests with these eventIds: nope'
      ]
    ])('POST answers 400 with the reason for %j', async (payload, message) => {
      const response = await post('/schedules/shop', payload);
      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe(message);
    });

    it('PUT changes the given fields; DELETE removes the schedule (204)', async () => {
      const created: Jsonified<ScheduleResponse> = (
        await post('/schedules/shop', daily)
      ).json();

      const put = await app.inject({
        method: 'PUT',
        url: `/schedules/shop/${created.id}`,
        payload: { kind: 'weekly', weekdays: [6, 0], enabled: false }
      });
      expect(put.statusCode).toBe(200);
      expect(put.json()).toMatchObject({
        name: 'Morning',
        kind: 'weekly',
        time: '07:30',
        weekdays: [0, 6],
        enabled: false,
        nextRunAt: null
      });
      const badPut = await app.inject({
        method: 'PUT',
        url: `/schedules/shop/${created.id}`,
        payload: { everyHours: 0, kind: 'everyHours' }
      });
      expect(badPut.statusCode).toBe(400);

      const deleted = await app.inject({
        method: 'DELETE',
        url: `/schedules/shop/${created.id}`
      });
      expect(deleted.statusCode).toBe(204);
      const again = await app.inject({
        method: 'DELETE',
        url: `/schedules/shop/${created.id}`
      });
      expect(again.statusCode).toBe(404);
    });

    it('POST run-now enqueues a headless schedule batch (201)', async () => {
      const created: Jsonified<ScheduleResponse> = (
        await post('/schedules/shop', { ...daily, enabled: false })
      ).json();

      const run = await post(`/schedules/shop/${created.id}/run-now`);

      expect(run.statusCode).toBe(201);
      expect(run.json()).toMatchObject({
        source: 'schedule',
        scheduleId: created.id,
        headless: true
      });
      await batchQueue.whenIdle();
      const [listed] = (
        await app.inject({ method: 'GET', url: '/schedules/shop' })
      ).json();
      expect(typeof listed.lastRunAt).toBe('string');
    });

    it('answers 404 for an unknown project', async () => {
      const list = await app.inject({ method: 'GET', url: '/schedules/nope' });
      const create = await post('/schedules/nope', daily);
      expect(list.statusCode).toBe(404);
      expect(create.statusCode).toBe(404);
    });
  });

  describe('GET /events', () => {
    it('streams batchUpdate events', async () => {
      await app.listen(0, '127.0.0.1');
      const address = app.getHttpServer().address();
      const port =
        typeof address === 'object' && address !== null ? address.port : 0;
      const abort = new AbortController();
      const stream = await fetch(`http://127.0.0.1:${port}/events`, {
        signal: abort.signal
      });
      const reader = stream.body?.getReader();
      if (!reader) throw new Error('No event stream');

      const created = await post('/batch-runs/shop', {
        eventIds: ['view_item'],
        headless: true
      });
      let text = '';
      const decoder = new TextDecoder();
      while (!text.includes('event: batchUpdate')) {
        const { value, done } = await reader.read();
        if (done) break;
        text += decoder.decode(value);
      }
      abort.abort();

      const block = text
        .split('\n\n')
        .find((chunk) => chunk.includes('event: batchUpdate'));
      const data = block
        ?.split('\n')
        .find((line) => line.startsWith('data: '))
        ?.slice('data: '.length);
      expect(JSON.parse(data ?? 'null')).toEqual({
        batchId: created.json().id,
        projectSlug: 'shop',
        status: 'pending',
        items: [{ eventId: 'view_item', status: 'pending', message: null }]
      });
    });

    it('streams a batchFinished event when the batch ends', async () => {
      fakeRun.behaviors.set('add_to_cart', 'failed');
      await app.listen(0, '127.0.0.1');
      const address = app.getHttpServer().address();
      const port =
        typeof address === 'object' && address !== null ? address.port : 0;
      const abort = new AbortController();
      const stream = await fetch(`http://127.0.0.1:${port}/events`, {
        signal: abort.signal
      });
      const reader = stream.body?.getReader();
      if (!reader) throw new Error('No event stream');

      const created = await post('/batch-runs/shop', {
        eventIds: ['view_item', 'add_to_cart'],
        headless: true
      });
      // Complete events only: each ends with a blank line.
      const finishedBlock = (text: string) =>
        text
          .split('\n\n')
          .slice(0, -1)
          .find((chunk) => chunk.includes('event: batchFinished'));
      let text = '';
      const decoder = new TextDecoder();
      while (!finishedBlock(text)) {
        const { value, done } = await reader.read();
        if (done) break;
        text += decoder.decode(value);
      }
      abort.abort();

      const block = finishedBlock(text);
      const data = block
        ?.split('\n')
        .find((line) => line.startsWith('data: '))
        ?.slice('data: '.length);
      expect(JSON.parse(data ?? 'null')).toEqual({
        batchId: created.json().id,
        projectSlug: 'shop',
        source: 'manual',
        status: 'completed',
        total: 2,
        passed: 1,
        partial: 0,
        failed: 1,
        error: 0,
        cancelled: 0
      });
    });
  });
});
