import { TestBed } from '@angular/core/testing';
import { ReportTableDataSourceModelService } from './report-table-data-source-model.service';

describe('ReportTableDataSourceModelService', () => {
  it('starts with no rows and nothing selected', () => {
    TestBed.configureTestingModule({});
    const svc = TestBed.inject(ReportTableDataSourceModelService);

    expect(svc.computedDataSource().data).toEqual([]);
    expect(svc.computedSelection().selected).toEqual([]);
  });
});
