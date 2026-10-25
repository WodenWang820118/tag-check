import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import {
  ScheduleJson,
  SchedulesService
} from '../../../../shared/services/api/schedules/schedules.service';
import { InformationDialogComponent } from '../../../../shared/components/information-dialog/information-dialog.component';
import { ScheduleDialogComponent } from '../../components/schedule-dialog/schedule-dialog.component';
import { SchedulesViewComponent } from './schedules-view.component';

/** GET /schedules/:projectSlug's JSON (dates are strings). */
const SCHEDULES: ScheduleJson[] = JSON.parse(
  JSON.stringify([
    {
      id: 1,
      projectSlug: 'demo',
      name: 'Morning check',
      eventIds: ['id-add_to_cart', 'id-purchase'],
      kind: 'daily',
      time: '09:00',
      weekdays: null,
      everyHours: null,
      enabled: true,
      lastRunAt: '2026-10-25T07:00:00.000Z',
      nextRunAt: '2099-10-26T07:00:00.000Z',
      createdAt: '2026-10-20T09:00:00.000Z',
      updatedAt: '2026-10-25T07:00:00.000Z'
    },
    {
      id: 2,
      projectSlug: 'demo',
      name: 'Hourly',
      eventIds: ['id-view_item'],
      kind: 'everyHours',
      time: null,
      weekdays: null,
      everyHours: 6,
      enabled: false,
      lastRunAt: null,
      nextRunAt: null,
      createdAt: '2026-10-20T09:00:00.000Z',
      updatedAt: '2026-10-20T09:00:00.000Z'
    }
  ])
) as ScheduleJson[];

async function render(rows: ScheduleJson[]) {
  const service = {
    list: vi.fn(() => of(rows)),
    update: vi.fn(
      (_slug: string, _id: number, changes: Partial<ScheduleJson>) =>
        of({ ...SCHEDULES[0], ...changes, nextRunAt: null })
    ),
    delete: vi.fn(() => of(undefined)),
    runNow: vi.fn(() => of({ id: 9, items: [{}, {}] }))
  };
  let dialogResult: unknown = undefined;
  const dialog = {
    open: vi.fn(() => ({
      afterClosed: (): Observable<unknown> => of(dialogResult)
    }))
  };
  const snackBar = { open: vi.fn() };
  TestBed.configureTestingModule({
    imports: [SchedulesViewComponent],
    providers: [
      provideNoopAnimations(),
      { provide: SchedulesService, useValue: service },
      { provide: MatDialog, useValue: dialog },
      { provide: MatSnackBar, useValue: snackBar },
      {
        provide: ActivatedRoute,
        useValue: {
          parent: { paramMap: of(convertToParamMap({ projectSlug: 'demo' })) }
        }
      }
    ]
  });
  const fixture = TestBed.createComponent(SchedulesViewComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const query = (testId: string) =>
    element.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  return {
    service,
    dialog,
    snackBar,
    query,
    settle,
    closeDialogWith: (result: unknown) => {
      dialogResult = result;
    }
  };
}

describe('SchedulesViewComponent', () => {
  it("lists the project's schedules", async () => {
    const { service, query } = await render(SCHEDULES);

    expect(service.list).toHaveBeenCalledWith('demo');
    expect(query('schedules-row-1')?.textContent).toContain('Morning check');
    expect(query('schedules-row-1')?.textContent).toContain('2');
    expect(query('schedules-preset-1')?.textContent?.trim()).toBe(
      'Daily at 09:00'
    );
    expect(query('schedules-preset-2')?.textContent?.trim()).toBe(
      'Every 6 hours'
    );
    expect(query('schedules-next-run-1')?.textContent).toContain('2099');
    expect(query('schedules-next-run-2')?.textContent?.trim()).toBe('—');
    expect(query('schedules-last-run-2')?.textContent?.trim()).toBe('Never');
    expect(query('schedules-empty')).toBeNull();
  });

  it('says how to add a schedule when there is none', async () => {
    const { query } = await render([]);

    expect(query('schedules-empty')?.textContent).toContain(
      'Schedule selected'
    );
  });

  it('turns a schedule off and shows the saved schedule', async () => {
    const { service, query, settle } = await render(SCHEDULES);

    query('schedules-enabled-1')?.querySelector('button')?.click();
    await settle();

    expect(service.update).toHaveBeenCalledWith('demo', 1, { enabled: false });
    expect(query('schedules-next-run-1')?.textContent?.trim()).toBe('—');
  });

  it('runs a schedule now', async () => {
    const { service, snackBar, query, settle } = await render(SCHEDULES);

    query('schedules-run-now-1')?.click();
    await settle();

    expect(service.runNow).toHaveBeenCalledWith('demo', 1);
    expect(snackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Queued "Morning check" (2 tests, headless)'),
      'Close',
      expect.any(Object)
    );
  });

  it('edits a schedule in the schedule dialog', async () => {
    const { dialog, query, settle, closeDialogWith } = await render(SCHEDULES);
    closeDialogWith({ ...SCHEDULES[0], name: 'Renamed' });

    query('schedules-edit-1')?.click();
    await settle();

    expect(dialog.open).toHaveBeenCalledWith(ScheduleDialogComponent, {
      data: {
        projectSlug: 'demo',
        eventIds: SCHEDULES[0]?.eventIds,
        schedule: SCHEDULES[0]
      }
    });
    expect(query('schedules-row-1')?.textContent).toContain('Renamed');
  });

  it('deletes a schedule once confirmed', async () => {
    const { service, dialog, query, settle, closeDialogWith } =
      await render(SCHEDULES);

    closeDialogWith(false);
    query('schedules-delete-2')?.click();
    await settle();
    expect(service.delete).not.toHaveBeenCalled();

    closeDialogWith(true);
    query('schedules-delete-2')?.click();
    await settle();

    expect(dialog.open).toHaveBeenCalledWith(
      InformationDialogComponent,
      expect.objectContaining({
        data: expect.objectContaining({ title: 'Delete schedule' })
      })
    );
    expect(service.delete).toHaveBeenCalledWith('demo', 2);
    expect(query('schedules-row-2')).toBeNull();
  });
});
