import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { RUN_SUMMARY_SAMPLE } from '@utils';
import { of } from 'rxjs';
import { FileReportService } from '../../../../shared/services/api/file-report/file-report.service';
import { FileTableDataSourceFacadeService } from './file-table-data-source-facade.service';

/** Runs as GET /file-reports returns them: newest first. */
const newer = {
  ...RUN_SUMMARY_SAMPLE,
  runId: 8,
  runAt: '2026-10-21T01:00:00.000Z'
};
const older = RUN_SUMMARY_SAMPLE;

describe('FileTableDataSourceFacadeService', () => {
  let facade: FileTableDataSourceFacadeService;
  const fileReportService = {
    downloadFileReports: vi.fn(() => of(null)),
    // As DELETE /file-reports/:projectSlug answers: only the runs it deleted.
    deleteRuns: vi.fn(() => of({ deletedRunIds: [newer.runId] }))
  };

  beforeEach(() => {
    fileReportService.downloadFileReports.mockClear();
    fileReportService.deleteRuns.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: FileReportService, useValue: fileReportService },
        { provide: MatDialog, useValue: { open: vi.fn() } }
      ]
    });
    facade = TestBed.inject(FileTableDataSourceFacadeService);
  });

  it('lists one row per run in the order the API returns them', () => {
    facade.initializeData(null as never, null as never, {
      fileReports: [newer, older],
      projectSlug: 'shop'
    });

    expect(facade.dataSource.data).toEqual([newer, older]);
  });

  it('clears the previous project rows when a project has no runs', () => {
    facade.initializeData(null as never, null as never, {
      fileReports: [newer],
      projectSlug: 'shop'
    });
    facade.initializeData(null as never, null as never, {
      fileReports: null,
      projectSlug: 'empty'
    });

    expect(facade.dataSource.data).toEqual([]);
    expect(facade.selection.selected).toEqual([]);
  });

  it('deletes the selected runs and drops the rows the server deleted', () => {
    facade.initializeData(null as never, null as never, {
      fileReports: [newer, older],
      projectSlug: 'shop'
    });
    facade.selection.select(newer, older);

    facade['handleReportDeletion']();

    expect(fileReportService.deleteRuns).toHaveBeenCalledWith('shop', [
      newer.runId,
      older.runId
    ]);
    expect(facade.dataSource.data).toEqual([older]);
    expect(facade.selection.selected).toEqual([]);
  });

  it('downloads each selected test once, however many of its runs are selected', () => {
    facade['handleReportDownload']('shop', [newer, older]);

    expect(fileReportService.downloadFileReports).toHaveBeenCalledWith('shop', [
      RUN_SUMMARY_SAMPLE.eventId
    ]);
  });

  it('selects every run on the page, and a second toggle clears them', () => {
    facade.initializeData(null as never, null as never, {
      fileReports: [newer, older],
      projectSlug: 'shop'
    });

    facade.toggleAllRows();
    expect(facade.selection.selected).toEqual([newer, older]);
    expect(facade.isAllSelected).toBe(true);
    expect(facade.checkboxLabel()).toBe('deselect all');

    facade.toggleAllRows();
    expect(facade.selection.selected).toEqual([]);
    expect(facade.isAllSelected).toBe(false);
    expect(facade.checkboxLabel()).toBe('select all');
  });

  it('toggles a single run and labels its checkbox by event and time', () => {
    facade.initializeData(null as never, null as never, {
      fileReports: [newer, older],
      projectSlug: 'shop'
    });

    expect(facade.checkboxLabel(older)).toBe(
      `select the add_to_cart run of ${older.runAt}`
    );
    facade.toggleRow(older);
    expect(facade.selection.selected).toEqual([older]);
    expect(facade.checkboxLabel(older)).toBe(
      `deselect the add_to_cart run of ${older.runAt}`
    );

    facade.toggleRow(older);
    expect(facade.selection.selected).toEqual([]);
  });
});
