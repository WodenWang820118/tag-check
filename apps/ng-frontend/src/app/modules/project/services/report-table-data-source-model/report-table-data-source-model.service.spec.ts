import { TestBed } from '@angular/core/testing';
import { MatTableDataSource } from '@angular/material/table';
import { ReportTableDataSourceModelService } from './report-table-data-source-model.service';

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
    svc.dataSource.set(new MatTableDataSource([{ a: 1 }, { a: 2 }] as any));
    expect(svc.isAllSelected()).toBe(false);
  });

  it('returns true when every row is selected', () => {
    const items = [{ a: 1 }, { a: 2 }] as any[];
    svc.dataSource.set(new MatTableDataSource(items));
    const sel = svc.computedSelection();
    sel.select(...items);
    svc.selection.set(sel);
    expect(svc.isAllSelected()).toBe(true);
  });
});
