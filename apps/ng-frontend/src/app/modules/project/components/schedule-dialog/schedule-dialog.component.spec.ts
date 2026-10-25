import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ScheduleJson,
  SchedulesService
} from '../../../../shared/services/api/schedules/schedules.service';
import {
  ScheduleDialogComponent,
  ScheduleDialogData
} from './schedule-dialog.component';

/** A schedule as GET /schedules/:projectSlug returns it (dates are strings). */
const SCHEDULE: ScheduleJson = JSON.parse(
  JSON.stringify({
    id: 5,
    projectSlug: 'demo',
    name: 'Evening check',
    eventIds: ['id-add_to_cart', 'id-purchase'],
    kind: 'weekly',
    time: '18:30',
    weekdays: [1, 3],
    everyHours: null,
    enabled: true,
    lastRunAt: null,
    nextRunAt: '2026-10-26T17:30:00.000Z',
    createdAt: '2026-10-25T09:00:00.000Z',
    updatedAt: '2026-10-25T09:00:00.000Z'
  })
) as ScheduleJson;

async function render(data: ScheduleDialogData) {
  const service = {
    create: vi.fn(() => of(SCHEDULE)),
    update: vi.fn(() => of(SCHEDULE))
  };
  const dialogRef = { close: vi.fn() };
  TestBed.configureTestingModule({
    imports: [ScheduleDialogComponent],
    providers: [
      provideNoopAnimations(),
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: dialogRef },
      { provide: SchedulesService, useValue: service }
    ]
  });
  const fixture = TestBed.createComponent(ScheduleDialogComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const query = (testId: string): HTMLElement => {
    const found = element.querySelector<HTMLElement>(
      `[data-testid="${testId}"]`
    );
    if (!found) {
      throw new Error(`${testId} not found`);
    }
    return found;
  };
  const type = async (testId: string, value: string) => {
    const input = query(testId);
    if (!(input instanceof HTMLInputElement)) {
      throw new Error(`${testId} is not an input`);
    }
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const click = async (selector: string) => {
    element.querySelector<HTMLElement>(selector)?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const saveButton = () => query('schedules-dialog-save') as HTMLButtonElement;
  return { service, dialogRef, element, query, type, click, saveButton };
}

describe('ScheduleDialogComponent', () => {
  afterEach(() => vi.useRealTimers());

  it('creates a weekly schedule of the selected tests and shows its next run', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    // A Sunday, 10:00 local time.
    vi.setSystemTime(new Date(2026, 9, 25, 10, 0));
    const { service, dialogRef, element, query, type, click, saveButton } =
      await render({
        projectSlug: 'demo',
        eventIds: ['id-add_to_cart', 'id-purchase']
      });

    expect(element.textContent).toContain('2 tests');
    expect(query('schedules-dialog-note').textContent).toContain(
      'Scheduled runs are headless and run while Tag Check is running'
    );
    expect(saveButton().disabled).toBe(true);

    await type('schedules-dialog-name', 'Evening check');
    await click('[data-testid="schedules-dialog-kind-weekly"] button');
    await type('schedules-dialog-time', '18:30');
    // Sunday is checked by default, as today.
    await click('[data-testid="schedules-dialog-weekday-sun"] input');
    await click('[data-testid="schedules-dialog-weekday-mon"] input');
    await click('[data-testid="schedules-dialog-weekday-wed"] input');

    expect(query('schedules-dialog-next-run').textContent).toContain(
      'Next run: Mon, Oct 26, 2026, 18:30'
    );
    expect(saveButton().disabled).toBe(false);
    await click('[data-testid="schedules-dialog-save"]');

    expect(service.create).toHaveBeenCalledWith('demo', {
      name: 'Evening check',
      eventIds: ['id-add_to_cart', 'id-purchase'],
      kind: 'weekly',
      time: '18:30',
      weekdays: [1, 3],
      everyHours: null,
      enabled: true
    });
    expect(dialogRef.close).toHaveBeenCalledWith(SCHEDULE);
  });

  it('explains an invalid preset and does not save it', async () => {
    const { query, type, click, saveButton } = await render({
      projectSlug: 'demo',
      eventIds: ['id-add_to_cart']
    });
    await type('schedules-dialog-name', 'Hourly');
    await click('[data-testid="schedules-dialog-kind-every-hours"] button');
    await type('schedules-dialog-hours', '30');

    expect(query('schedules-dialog-next-run').textContent).toContain(
      'everyHours must be a whole number from 1 to 24'
    );
    expect(saveButton().disabled).toBe(true);
  });

  it('edits a schedule, and shows why the API refused it', async () => {
    const { service, dialogRef, element, query, click } = await render({
      projectSlug: 'demo',
      eventIds: SCHEDULE.eventIds,
      schedule: SCHEDULE
    });
    service.update.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: {
              statusCode: 400,
              message: {
                message: 'name must be at most 255 characters',
                error: 'Bad Request',
                statusCode: 400
              }
            }
          })
      )
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(element.textContent).toContain('Edit schedule');
    expect((query('schedules-dialog-name') as HTMLInputElement).value).toBe(
      'Evening check'
    );
    await click('[data-testid="schedules-dialog-enabled"] button');
    expect(query('schedules-dialog-next-run').textContent).toContain(
      'Disabled'
    );
    await click('[data-testid="schedules-dialog-save"]');

    expect(service.update).toHaveBeenCalledWith(
      'demo',
      5,
      expect.objectContaining({ enabled: false, weekdays: [1, 3] })
    );
    expect(query('schedules-dialog-error').textContent).toContain(
      'name must be at most 255 characters'
    );
    expect(dialogRef.close).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});
