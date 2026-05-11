import { TestBed } from '@angular/core/testing';
import { MatTableDataSource } from '@angular/material/table';
import { FileTableDataSourceModelService } from './file-table-data-source-model.service';

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
    const ds = new MatTableDataSource<any>([{ a: 1 }, { a: 2 }]);
    svc.dataSource.set(ds);
    expect(svc.isAllSelected()).toBe(false);
  });

  it('reports all-selected once selection equals data length', () => {
    const items = [{ a: 1 }, { a: 2 }] as any[];
    svc.dataSource.set(new MatTableDataSource(items));
    const sel = svc.computedSelection();
    sel.select(...items);
    svc.selection.set(sel);
    expect(svc.isAllSelected()).toBe(true);
  });

  it('reports all-selected state without logging', () => {
    const items = [{ a: 1 }, { a: 2 }] as any[];
    svc.dataSource.set(new MatTableDataSource(items));
    const sel = svc.computedSelection();
    sel.select(...items);
    svc.selection.set(sel);
    expect(svc.isAllSelected()).toBe(true);
  });
});
