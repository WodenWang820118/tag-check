import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { RUN_SUMMARY_SAMPLE } from '@utils';
import { EMPTY, of } from 'rxjs';

// MatTableDataSource subscribes to these on a paginator or sort.
const noStreams = { page: EMPTY, initialized: EMPTY };
import { FileReportService } from '../../../../shared/services/api/file-report/file-report.service';
import { FileTableDataSourceService } from '../../../../shared/services/data-source/file-table-data-source.service';
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
  const dialog = { open: vi.fn() };
  const fileReportService = {
    downloadFileReports: vi.fn(() => of(null)),
    // As DELETE /file-reports/:projectSlug answers: only the runs it deleted.
    deleteRuns: vi.fn(() => of({ deletedRunIds: [newer.runId] }))
  };

  beforeEach(() => {
    fileReportService.downloadFileReports.mockClear();
    fileReportService.deleteRuns.mockClear();
    dialog.open.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: FileReportService, useValue: fileReportService },
        { provide: MatDialog, useValue: dialog }
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

  it('deletes the selected runs and drops the rows the server deleted', async () => {
    facade.initializeData(null as never, null as never, {
      fileReports: [newer, older],
      projectSlug: 'shop'
    });
    facade.selection.select(newer, older);

    await facade['handleReportDeletion']();

    expect(fileReportService.deleteRuns).toHaveBeenCalledWith('shop', [
      newer.runId,
      older.runId
    ]);
    expect(facade.dataSource.data).toEqual([older]);
    expect(facade.selection.selected).toEqual([]);
  });

  it('sends nothing to delete when no run is selected', async () => {
    facade.initializeData(null as never, null as never, {
      fileReports: [newer],
      projectSlug: 'shop'
    });

    await facade['handleReportDeletion']();

    expect(fileReportService.deleteRuns).not.toHaveBeenCalled();
    expect(facade.dataSource.data).toEqual([newer]);
  });

  it('asks before deleting, resets the request, then deletes the selected runs', async () => {
    dialog.open.mockReturnValue({ afterClosed: () => of(true) });
    facade.initializeData(null as never, null as never, {
      fileReports: [newer, older],
      projectSlug: 'shop'
    });
    facade.selection.select(newer);
    const requests = TestBed.inject(FileTableDataSourceService);

    requests.setDeletedSignal(true);
    TestBed.tick();

    await vi.waitFor(() =>
      expect(fileReportService.deleteRuns).toHaveBeenCalledWith('shop', [
        newer.runId
      ])
    );
    expect(dialog.open).toHaveBeenCalledOnce();
    expect(requests.getDeletedSignal()).toBe(false);
  });

  it('deletes nothing when the delete dialog is cancelled', async () => {
    dialog.open.mockReturnValue({ afterClosed: () => of(false) });
    const requests = TestBed.inject(FileTableDataSourceService);

    requests.setDeletedSignal(true);
    TestBed.tick();

    await vi.waitFor(() => expect(requests.getDeletedSignal()).toBe(false));
    expect(fileReportService.deleteRuns).not.toHaveBeenCalled();
  });

  it('asks before downloading, then downloads the selected tests', async () => {
    dialog.open.mockReturnValue({ afterClosed: () => of(true) });
    facade.initializeData(null as never, null as never, {
      fileReports: [newer],
      projectSlug: 'shop'
    });
    facade.selection.select(newer);
    const requests = TestBed.inject(FileTableDataSourceService);

    requests.setDownloadSignal(true);
    TestBed.tick();

    await vi.waitFor(() =>
      expect(fileReportService.downloadFileReports).toHaveBeenCalledWith(
        'shop',
        [RUN_SUMMARY_SAMPLE.eventId]
      )
    );
    expect(requests.getDownloadSignal()).toBe(false);
  });

  it('downloads each selected test once, however many of its runs are selected', async () => {
    await facade['handleReportDownload']('shop', [newer, older]);

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

  it('applies filtering, sorting and pagination to select visible runs', () => {
    const run1 = {
      ...RUN_SUMMARY_SAMPLE,
      runId: 101,
      eventName: 'view_item'
    };
    const run2 = {
      ...RUN_SUMMARY_SAMPLE,
      runId: 102,
      eventName: 'add_to_cart'
    };
    const run3 = {
      ...RUN_SUMMARY_SAMPLE,
      runId: 103,
      eventName: 'begin_checkout'
    };
    const paginator = { pageIndex: 0, pageSize: 1, ...noStreams };
    const sort = {
      active: 'eventName',
      direction: 'asc',
      sortChange: EMPTY,
      ...noStreams
    };
    facade.initializeData(paginator as never, sort as never, {
      fileReports: [run1, run2, run3],
      projectSlug: 'shop'
    });
    facade.dataSource.sortData = (data) =>
      [...data].sort((a, b) => a.eventName.localeCompare(b.eventName));
    facade.dataSource.filteredData = [run2, run3];

    expect(facade.isAllSelected).toBe(false);
    facade.toggleAllRows();
    expect(facade.selection.selected).toEqual([run2]);
    expect(facade.isAllSelected).toBe(true);
  });

  it('falls back to all data when paginator and filteredData are omitted', () => {
    facade.initializeData(null as never, null as never, {
      fileReports: [newer, older],
      projectSlug: 'shop'
    });
    delete (facade.dataSource as { filteredData?: unknown }).filteredData;

    facade.toggleAllRows();
    expect(facade.selection.selected).toEqual([newer, older]);
    expect(facade.isAllSelected).toBe(true);
  });

  it('handles partial page selection and retains off-page runs on deselect', () => {
    const run1 = { ...RUN_SUMMARY_SAMPLE, runId: 1 };
    const run2 = { ...RUN_SUMMARY_SAMPLE, runId: 2 };
    const run3 = { ...RUN_SUMMARY_SAMPLE, runId: 3 };
    const paginator = { pageIndex: 1, pageSize: 2, ...noStreams };
    facade.initializeData(paginator as never, null as never, {
      fileReports: [run1, run2, run3],
      projectSlug: 'shop'
    });
    facade.selection.select(run1);

    expect(facade.isAllSelected).toBe(false);
    facade.toggleAllRows();
    expect(facade.selection.selected).toEqual([run1, run3]);
    expect(facade.isAllSelected).toBe(true);

    facade.toggleAllRows();
    expect(facade.selection.selected).toEqual([run1]);
    expect(facade.isAllSelected).toBe(false);
  });

  it('returns false for isAllSelected when empty or out of range', () => {
    facade.initializeData(null as never, null as never, {
      fileReports: [],
      projectSlug: 'empty'
    });
    expect(facade.isAllSelected).toBe(false);

    const paginator = { pageIndex: 10, pageSize: 5, ...noStreams };
    facade.initializeData(paginator as never, null as never, {
      fileReports: [newer],
      projectSlug: 'shop'
    });
    expect(facade.isAllSelected).toBe(false);
  });

  it('preserves equal-valued but distinct run objects by identity', () => {
    const runA = { ...RUN_SUMMARY_SAMPLE };
    const runB = { ...RUN_SUMMARY_SAMPLE };
    facade.initializeData(null as never, null as never, {
      fileReports: [],
      projectSlug: 'shop'
    });

    facade.toggleRow(runA);
    expect(facade.selection.selected).toEqual([runA]);

    facade.toggleRow(runB);
    expect(facade.selection.selected).toEqual([runA, runB]);

    facade.toggleRow(runA);
    expect(facade.selection.selected).toEqual([runB]);
  });

  it('publishes a fresh SelectionModel instance after each toggle', () => {
    facade.initializeData(null as never, null as never, {
      fileReports: [newer],
      projectSlug: 'shop'
    });

    const initialModel = facade.selection;
    facade.toggleAllRows();
    const afterToggleAll = facade.selection;
    expect(afterToggleAll).not.toBe(initialModel);

    facade.toggleRow(newer);
    const afterToggleRow = facade.selection;
    expect(afterToggleRow).not.toBe(afterToggleAll);
  });
});
