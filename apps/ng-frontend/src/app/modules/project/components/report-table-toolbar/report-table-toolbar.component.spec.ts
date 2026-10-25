import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, expect, it, vi } from 'vitest';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { of, Subject } from 'rxjs';
import { ProjectDataSourceService } from '../../../../shared/services/data-source/project-data-source.service';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';
import { UploadSpecService } from '../../../../shared/services/upload-spec/upload-spec.service';
import { ReportTableDataSourceModelService } from '../../services/report-table-data-source-model/report-table-data-source-model.service';
import { ReportTableToolbarComponent } from './report-table-toolbar.component';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import type { IReportDetails } from '@utils';
import { ReportTableFacadeService } from '../report-table/report-table-facade.service';
import { BatchRunService } from '../../services/batch-run/batch-run.service';
import { RunHeadlessService } from '../../services/run-headless/run-headless.service';
import { ScheduleDialogComponent } from '../schedule-dialog/schedule-dialog.component';

/** Rows as GET /reports/:projectSlug returns them (dates are strings). */
const rows: IReportDetails[] = JSON.parse(
  JSON.stringify(
    ['add_to_cart', 'view_item', 'purchase'].map((eventName, index) => ({
      id: index + 1,
      eventId: `id-${eventName}`,
      testName: eventName,
      eventName,
      passed: false,
      requestPassed: false,
      hasRecording: true,
      lastRunAt: null,
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z'
    }))
  )
) as IReportDetails[];

describe('ReportTableToolbarComponent', () => {
  const batchRun = {
    isRunning: vi.fn(() => false),
    start: vi.fn(() => Promise.resolve(null))
  };
  const headless = signal(true);
  const runHeadless = {
    headless: headless.asReadonly(),
    load: vi.fn(),
    set: vi.fn((value: boolean) => headless.set(value))
  };
  const afterClosed = new Subject<unknown>();
  const dialog = { open: vi.fn(() => ({ afterClosed: () => afterClosed })) };
  // Selected out of table order on purpose.
  const selection = new SelectionModel<IReportDetails>(true, [
    rows[2],
    rows[0]
  ]);

  async function renderToolbar(): Promise<
    ComponentFixture<ReportTableToolbarComponent>
  > {
    TestBed.configureTestingModule({
      imports: [ReportTableToolbarComponent],
      providers: [
        provideNoopAnimations(),
        {
          provide: ProjectDataSourceService,
          useValue: {
            getFilterSignal: vi.fn(),
            setFilterSignal: vi.fn(),
            setDeletedSignal: vi.fn(),
            getPreventNavigationSignal: vi.fn().mockReturnValue(false),
            setPreventNavigationSignal: vi.fn()
          }
        },
        {
          provide: TestRunningFacadeService,
          useValue: {
            isRunningTest$: vi.fn().mockReturnValue(false),
            stopOperation: vi.fn().mockReturnValue(of(null))
          }
        },
        {
          provide: UploadSpecService,
          useValue: {
            startUpload: vi.fn()
          }
        },
        {
          provide: ReportTableDataSourceModelService,
          useValue: {
            selection: vi.fn(() => selection),
            dataSource: vi.fn(() => new MatTableDataSource(rows))
          }
        },
        {
          provide: ReportTableFacadeService,
          useValue: { projectSlug$: vi.fn(() => 'example-project-slug') }
        },
        { provide: BatchRunService, useValue: batchRun },
        { provide: RunHeadlessService, useValue: runHeadless },
        { provide: MatDialog, useValue: dialog }
      ]
    });
    const fixture = TestBed.createComponent(ReportTableToolbarComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders bookmark button with updated aria-label and matTooltip', async () => {
    const fixture = await renderToolbar();
    const buttonDe = fixture.debugElement.query(
      By.css('[data-testid="tests-prevent-navigation"]')
    );
    expect(buttonDe).not.toBeNull();

    const element = buttonDe.nativeElement as HTMLButtonElement;
    expect(element.getAttribute('aria-label')).toBe(
      'Bookmark: block default navigation on the last click'
    );

    const tooltip = buttonDe.injector.get(MatTooltip);
    expect(tooltip.message).toBe(
      "Bookmark: on the last click, block the browser's default link and form navigation (single-page app routing still runs)"
    );
  });

  function button(
    fixture: ComponentFixture<ReportTableToolbarComponent>,
    testId: string
  ): HTMLElement {
    const found = fixture.debugElement.query(
      By.css(`[data-testid="${testId}"]`)
    );
    if (!found) {
      throw new Error(`${testId} not found`);
    }
    return found.nativeElement as HTMLElement;
  }

  it('runs the selected tests as a batch in table order, headless as the toggle says', async () => {
    const fixture = await renderToolbar();
    const runSelected = button(fixture, 'tests-run-selected');

    expect(runHeadless.load).toHaveBeenCalledWith('example-project-slug');
    expect((runSelected as HTMLButtonElement).disabled).toBe(false);
    runSelected.click();

    expect(batchRun.start).toHaveBeenCalledWith(
      'example-project-slug',
      ['id-add_to_cart', 'id-purchase'],
      true
    );
  });

  it('remembers the Run headless choice', async () => {
    const fixture = await renderToolbar();
    const toggle = button(fixture, 'tests-run-headless');

    toggle.querySelector('button')?.click();
    fixture.detectChanges();

    expect(runHeadless.set).toHaveBeenCalledWith(false);
  });

  it('opens the schedule dialog with the selected tests in table order', async () => {
    const fixture = await renderToolbar();

    button(fixture, 'tests-schedule-selected').click();

    expect(dialog.open).toHaveBeenCalledWith(ScheduleDialogComponent, {
      data: {
        projectSlug: 'example-project-slug',
        eventIds: ['id-add_to_cart', 'id-purchase']
      }
    });
    afterClosed.next(undefined);
  });
});
