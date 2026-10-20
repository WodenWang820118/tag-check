import { TestBed } from '@angular/core/testing';
import { MatTableDataSource } from '@angular/material/table';
import { ReportTableDataSourceModelService } from './report-table-data-source-model.service';
import type { IReportDetails } from '@utils';

/** Table rows identified by event id; the selection logic reads nothing else. */
const rows = (...eventIds: string[]) =>
  eventIds.map((eventId) => ({ eventId }) as IReportDetails);

describe('ReportTableDataSourceModelService', () => {
  let svc: ReportTableDataSourceModelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(ReportTableDataSourceModelService);
  });

  it('starts with empty data and reports all-selected (0/0)', () => {
    expect(svc.computedDataSource().data).toEqual([]);
    expect(svc.computedSelection().selected).toEqual([]);
    expect(svc.isAllSelected()).toBe(true);
  });

  it('returns false when fewer rows are selected than present', () => {
    svc.dataSource.set(new MatTableDataSource(rows('a', 'b')));
    expect(svc.isAllSelected()).toBe(false);
  });

  it('returns true when every row is selected', () => {
    const items = rows('a', 'b');
    svc.dataSource.set(new MatTableDataSource(items));
    const sel = svc.computedSelection();
    sel.select(...items);
    svc.selection.set(sel);
    expect(svc.isAllSelected()).toBe(true);
  });
});
