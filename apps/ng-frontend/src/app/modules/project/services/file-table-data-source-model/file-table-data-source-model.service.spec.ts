import { TestBed } from '@angular/core/testing';
import { MatTableDataSource } from '@angular/material/table';
import { FileTableDataSourceModelService } from './file-table-data-source-model.service';
import { Jsonified, RUN_SUMMARY_SAMPLE, RunSummary } from '@utils';

/** Runs as GET /file-reports returns them, one per event id. */
const rows = (...eventIds: string[]): Jsonified<RunSummary>[] =>
  eventIds.map((eventId, index) => ({
    ...RUN_SUMMARY_SAMPLE,
    runId: index + 1,
    eventId
  }));

describe('FileTableDataSourceModelService', () => {
  let svc: FileTableDataSourceModelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(FileTableDataSourceModelService);
  });

  it('initializes with an empty data source and selection', () => {
    expect(svc.computedDataSource().data).toEqual([]);
    expect(svc.computedSelection().selected).toEqual([]);
    expect(svc.isAllSelected()).toBe(true);
  });

  it('reports not-all-selected when selection is smaller than data', () => {
    const ds = new MatTableDataSource(rows('a', 'b'));
    svc.dataSource.set(ds);
    expect(svc.isAllSelected()).toBe(false);
  });

  it('reports all-selected once selection equals data length', () => {
    const items = rows('a', 'b');
    svc.dataSource.set(new MatTableDataSource(items));
    const sel = svc.computedSelection();
    sel.select(...items);
    svc.selection.set(sel);
    expect(svc.isAllSelected()).toBe(true);
  });

  it('reports all-selected state without logging', () => {
    const items = rows('a', 'b');
    svc.dataSource.set(new MatTableDataSource(items));
    const sel = svc.computedSelection();
    sel.select(...items);
    svc.selection.set(sel);
    expect(svc.isAllSelected()).toBe(true);
  });
});
