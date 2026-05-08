import { SelectionModel } from '@angular/cdk/collections';
import { signal } from '@angular/core';
import type { IReportDetails } from '@utils';
import { ReportTableSelectionFacadeService } from './report-table-selection-facade.service';

type Row = IReportDetails;
const row = (position: number): Row => ({ position }) as Row;

const buildDs = (rows: Row[]) => ({
  data: rows,
  filteredData: rows,
  sort: undefined,
  sortData: (d: Row[]) => d,
  paginator: { pageIndex: 0, pageSize: rows.length }
});

describe('ReportTableSelectionFacadeService', () => {
  const makeService = (rows: Row[]) => {
    const dataSource = signal(buildDs(rows));
    const selection = signal(new SelectionModel<Row>(true, []));
    const model = { dataSource, selection } as never;
    return {
      service: new ReportTableSelectionFacadeService(model),
      selection
    };
  };

  it('toggleAllRows selects every visible row when nothing is selected', () => {
    const rows = [row(0), row(1)];
    const { service, selection } = makeService(rows);
    service.toggleAllRows();
    expect(selection().selected).toEqual(rows);
  });

  it('toggleAllRows clears the page selection when every row is already selected', () => {
    const rows = [row(0), row(1)];
    const { service, selection } = makeService(rows);
    selection.set(new SelectionModel<Row>(true, [...rows]));
    service.toggleAllRows();
    expect(selection().selected).toEqual([]);
  });

  it('toggleRow flips the selection state for a single row immutably', () => {
    const rows = [row(0)];
    const { service, selection } = makeService(rows);
    service.toggleRow(rows[0]);
    expect(selection().selected).toEqual([rows[0]]);
    const after = selection();
    service.toggleRow(rows[0]);
    expect(selection()).not.toBe(after);
    expect(selection().selected).toEqual([]);
  });

  it('checkboxLabel returns deselect/select all based on isAllSelected', () => {
    const rows = [row(0)];
    const { service, selection } = makeService(rows);
    expect(service.checkboxLabel()).toBe('select all');
    selection.set(new SelectionModel<Row>(true, [rows[0]]));
    expect(service.checkboxLabel()).toBe('deselect all');
  });

  it('checkboxLabel returns row-level deselect/select with 1-based position', () => {
    const rows = [row(4)];
    const { service, selection } = makeService(rows);
    expect(service.checkboxLabel(rows[0])).toBe('select row 5');
    selection.set(new SelectionModel<Row>(true, [rows[0]]));
    expect(service.checkboxLabel(rows[0])).toBe('deselect row 5');
  });

  it('isAllSelected returns false for an empty page', () => {
    const { service } = makeService([]);
    expect(service.isAllSelected()).toBe(false);
  });
});
