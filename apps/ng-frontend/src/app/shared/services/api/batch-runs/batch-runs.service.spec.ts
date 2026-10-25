import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../../../environments/environment';
import { BatchRunJson, BatchRunsService } from './batch-runs.service';

const batch: BatchRunJson = JSON.parse(
  JSON.stringify({
    id: 4,
    projectSlug: 'demo',
    source: 'manual',
    scheduleId: null,
    headless: true,
    status: 'pending',
    createdAt: '2026-10-25T09:00:00.000Z',
    startedAt: null,
    finishedAt: null,
    items: []
  })
) as BatchRunJson;

describe('BatchRunsService', () => {
  let service: BatchRunsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(BatchRunsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('enqueues a batch with its tests and headless choice', async () => {
    const created = firstValueFrom(
      service.create('demo', { eventIds: ['a', 'b'], headless: true })
    );
    const request = http.expectOne(`${environment.batchRunsApiUrl}/demo`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      eventIds: ['a', 'b'],
      headless: true
    });
    request.flush(batch);
    await expect(created).resolves.toEqual(batch);
  });

  it("reads the project's newest batch, or null before the first", async () => {
    const latest = firstValueFrom(service.getLatest('demo'));
    http
      .expectOne(`${environment.batchRunsApiUrl}/demo?limit=1`)
      .flush([batch]);
    await expect(latest).resolves.toEqual(batch);

    const none = firstValueFrom(service.getLatest('demo'));
    http.expectOne(`${environment.batchRunsApiUrl}/demo?limit=1`).flush([]);
    await expect(none).resolves.toBeNull();
  });

  it('reads and cancels one batch', async () => {
    const read = firstValueFrom(service.get('demo', 4));
    http.expectOne(`${environment.batchRunsApiUrl}/demo/4`).flush(batch);
    await read;

    const cancelled = firstValueFrom(service.cancel('demo', 4));
    const request = http.expectOne(
      `${environment.batchRunsApiUrl}/demo/4/cancel`
    );
    expect(request.request.method).toBe('POST');
    request.flush({ ...batch, status: 'cancelled' });
    await expect(cancelled).resolves.toEqual(
      expect.objectContaining({ status: 'cancelled' })
    );
  });
});
