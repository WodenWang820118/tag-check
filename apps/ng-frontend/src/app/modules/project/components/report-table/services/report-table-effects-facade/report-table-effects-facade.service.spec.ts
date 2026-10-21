import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { REPORT_LIST_ITEM_SAMPLE } from '@utils';
import { ProjectDataSourceService } from '../../../../../../shared/services/data-source/project-data-source.service';
import { ReportService } from '../../../../../../shared/services/api/report/report.service';
import { ReportTableDataSourceModelService } from '../../../../services/report-table-data-source-model/report-table-data-source-model.service';
import { ReportMapperService } from '../../../../services/report-mapper/report-mapper.service';
import { ReportTableEffectsFacadeService } from './report-table-effects-facade.service';

describe('navigation bookmarks', () => {
  let response: Subject<unknown>;
  const updateTestEvents = vi.fn();
  const openSnackBar = vi.fn();
  let state: ProjectDataSourceService;
  let model: ReportTableDataSourceModelService;

  beforeEach(() => {
    response = new Subject();
    updateTestEvents.mockReset().mockReturnValue(response);
    openSnackBar.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: ReportService, useValue: { updateTestEvents } },
        { provide: MatDialog, useValue: { open: vi.fn() } },
        { provide: MatSnackBar, useValue: { open: openSnackBar } }
      ]
    });
    state = TestBed.inject(ProjectDataSourceService);
    model = TestBed.inject(ReportTableDataSourceModelService);
    // Feed the mapper the endpoint's JSON, including string dates.
    model.dataSource().data = new ReportMapperService().toReportDetails(
      JSON.parse(
        JSON.stringify([
          { ...REPORT_LIST_ITEM_SAMPLE, eventId: 'a', stopNavigation: false },
          { ...REPORT_LIST_ITEM_SAMPLE, eventId: 'b', stopNavigation: true },
          {
            ...REPORT_LIST_ITEM_SAMPLE,
            eventId: 'unselected',
            stopNavigation: false
          }
        ])
      )
    );
    TestBed.runInInjectionContext(() =>
      TestBed.inject(ReportTableEffectsFacadeService).initialize({
        getStatus: () => 'all',
        getProjectSlug: () => 'demo'
      })
    );
    TestBed.tick();
  });

  it('waits for save, then toggles selected rows while retaining table/selection state', () => {
    const ds = model.dataSource();
    const [first, second, unselected] = ds.data;
    model.selection().select(first, second);
    const filterPredicate = ds.filterPredicate;
    state.setPreventNavigationSignal(true);
    TestBed.tick();
    expect(updateTestEvents).toHaveBeenCalledTimes(1);
    expect(updateTestEvents).toHaveBeenCalledWith('demo', [
      expect.objectContaining({ eventId: 'a', stopNavigation: true }),
      expect.objectContaining({ eventId: 'b', stopNavigation: false })
    ]);
    expect(first.stopNavigation).toBe(false);
    expect(second.stopNavigation).toBe(true);
    expect(state.getPreventNavigationSignal()).toBe(true);

    // Changing selection during the save must not retarget the pending action.
    model.selection().clear();
    model.selection().select(unselected);
    response.next([]);
    TestBed.tick();
    expect(first.stopNavigation).toBe(true);
    expect(second.stopNavigation).toBe(false);
    expect(unselected.stopNavigation).toBe(false);
    expect(model.dataSource()).toBe(ds);
    expect(ds.filterPredicate).toBe(filterPredicate);
    expect(model.selection().selected).toEqual([unselected]);
    expect(state.getPreventNavigationSignal()).toBe(false);
    expect(updateTestEvents).toHaveBeenCalledTimes(1);
  });

  it('keeps the badge unchanged and reports a failed save', () => {
    const [row] = model.dataSource().data;
    model.selection().select(row);
    state.setPreventNavigationSignal(true);
    TestBed.tick();
    response.error(new Error('save failed'));
    TestBed.tick();
    expect(row.stopNavigation).toBe(false);
    expect(state.getPreventNavigationSignal()).toBe(false);
    expect(openSnackBar).toHaveBeenCalledWith(
      expect.stringContaining('Could not save navigation bookmarks'),
      'Dismiss',
      { duration: 5000 }
    );
  });

  it('does not send an update without selected tests', () => {
    state.setPreventNavigationSignal(true);
    TestBed.tick();
    expect(updateTestEvents).not.toHaveBeenCalled();
    expect(state.getPreventNavigationSignal()).toBe(false);
  });
});
