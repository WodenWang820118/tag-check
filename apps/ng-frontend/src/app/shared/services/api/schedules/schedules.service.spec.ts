import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../../../environments/environment';
import { ScheduleJson, SchedulesService } from './schedules.service';

const schedule: ScheduleJson = JSON.parse(
  JSON.stringify({
    id: 2,
    projectSlug: 'demo',
    name: 'Morning check',
    eventIds: ['a'],
    kind: 'daily',
    time: '09:00',
    weekdays: null,
    everyHours: null,
    enabled: true,
    lastRunAt: null,
    nextRunAt: '2026-10-26T08:00:00.000Z',
    createdAt: '2026-10-25T09:00:00.000Z',
    updatedAt: '2026-10-25T09:00:00.000Z'
  })
) as ScheduleJson;

describe('SchedulesService', () => {
  let service: SchedulesService;
  let http: HttpTestingController;
  const url = `${environment.schedulesApiUrl}/demo`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(SchedulesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists, creates and updates schedules', async () => {
    const listed = firstValueFrom(service.list('demo'));
    http.expectOne(url).flush([schedule]);
    await expect(listed).resolves.toEqual([schedule]);

    const created = firstValueFrom(
      service.create('demo', {
        name: 'Morning check',
        eventIds: ['a'],
        kind: 'daily',
        time: '09:00'
      })
    );
    const post = http.expectOne(url);
    expect(post.request.method).toBe('POST');
    post.flush(schedule);
    await created;

    const updated = firstValueFrom(
      service.update('demo', 2, { enabled: false })
    );
    const put = http.expectOne(`${url}/2`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ enabled: false });
    put.flush({ ...schedule, enabled: false, nextRunAt: null });
    await expect(updated).resolves.toEqual(
      expect.objectContaining({ enabled: false })
    );
  });

  it('deletes a schedule and runs one now', async () => {
    const deleted = firstValueFrom(service.delete('demo', 2));
    const del = http.expectOne(`${url}/2`);
    expect(del.request.method).toBe('DELETE');
    del.flush(null, { status: 204, statusText: 'No Content' });
    await deleted;

    const ran = firstValueFrom(service.runNow('demo', 2));
    const post = http.expectOne(`${url}/2/run-now`);
    expect(post.request.method).toBe('POST');
    post.flush({ id: 9 });
    await ran;
  });
});
