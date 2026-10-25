import { TestBed } from '@angular/core/testing';
import { FileTableDataSourceModelService } from './file-table-data-source-model.service';

describe('FileTableDataSourceModelService', () => {
  it('starts with no runs and nothing selected', () => {
    TestBed.configureTestingModule({});
    const svc = TestBed.inject(FileTableDataSourceModelService);

    expect(svc.computedDataSource().data).toEqual([]);
    expect(svc.computedSelection().selected).toEqual([]);
  });
});
