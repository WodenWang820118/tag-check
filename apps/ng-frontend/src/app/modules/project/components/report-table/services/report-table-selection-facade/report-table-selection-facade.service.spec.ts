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

  it('checkboxLabel names the row by its test name', () => {
    const rows = [
      { testName: 'GA4 event - add_to_cart', eventName: 'add_to_cart' } as Row
    ];
    const { service, selection } = makeService(rows);
    expect(service.checkboxLabel(rows[0])).toBe(
      'select GA4 event - add_to_cart'
    );
    selection.set(new SelectionModel<Row>(true, [rows[0]]));
    expect(service.checkboxLabel(rows[0])).toBe(
      'deselect GA4 event - add_to_cart'
    );
  });

  it('isAllSelected returns false for an empty page', () => {
    const { service } = makeService([]);
    expect(service.isAllSelected()).toBe(false);
  });

  it('applies filtering, sorting and pagination to select visible rows', () => {
    const r1 = {
      eventId: 'c',
      testName: 'cherry'
    } as Row;
    const r2 = {
      eventId: 'a',
      testName: 'apple'
    } as Row;
    const r3 = {
      eventId: 'b',
      testName: 'banana'
    } as Row;
    const allRows = [r1, r2, r3];
    const filtered = [r2, r3];
    const dataSource = signal({
      data: allRows,
      filteredData: filtered,
      sort: { active: 'testName' },
      sortData: (d: Row[]) =>
        [...d].sort((x, y) => x.testName.localeCompare(y.testName)),
      paginator: { pageIndex: 0, pageSize: 1 }
    });
    const selection = signal(new SelectionModel<Row>(true, []));
    const service = new ReportTableSelectionFacadeService({
      dataSource,
      selection
    } as never);

    expect(service.isAllSelected()).toBe(false);
    service.toggleAllRows();
    expect(selection().selected).toEqual([r2]);
    expect(service.isAllSelected()).toBe(true);
  });

  it('falls back to data when filteredData and paginator are missing', () => {
    const r1 = { eventId: '1' } as Row;
    const r2 = { eventId: '2' } as Row;
    const dataSource = signal({
      data: [r1, r2]
    });
    const selection = signal(new SelectionModel<Row>(true, []));
    const service = new ReportTableSelectionFacadeService({
      dataSource,
      selection
    } as never);

    service.toggleAllRows();
    expect(selection().selected).toEqual([r1, r2]);
    expect(service.isAllSelected()).toBe(true);
  });

  it('handles partial page selection and retains off-page rows on deselect', () => {
    const p0 = { eventId: 'p0' } as Row;
    const p1 = { eventId: 'p1' } as Row;
    const p2 = { eventId: 'p2' } as Row;
    const rows = [p0, p1, p2];
    const dataSource = signal({
      data: rows,
      filteredData: rows,
      sort: undefined,
      sortData: (d: Row[]) => d,
      paginator: { pageIndex: 1, pageSize: 2 }
    });
    const selection = signal(new SelectionModel<Row>(true, [p0, p1]));
    const service = new ReportTableSelectionFacadeService({
      dataSource,
      selection
    } as never);

    expect(service.isAllSelected()).toBe(false);
    service.toggleAllRows();
    expect(selection().selected).toEqual([p0, p1, p2]);
    expect(service.isAllSelected()).toBe(true);

    service.toggleAllRows();
    expect(selection().selected).toEqual([p0, p1]);
    expect(service.isAllSelected()).toBe(false);
  });

  it('returns false for isAllSelected on out-of-range pages', () => {
    const r1 = { eventId: '1' } as Row;
    const dataSource = signal({
      data: [r1],
      filteredData: [r1],
      sort: undefined,
      sortData: (d: Row[]) => d,
      paginator: { pageIndex: 5, pageSize: 10 }
    });
    const selection = signal(new SelectionModel<Row>(true, [r1]));
    const service = new ReportTableSelectionFacadeService({
      dataSource,
      selection
    } as never);

    expect(service.isAllSelected()).toBe(false);
  });

  it('preserves equal-valued but distinct row objects by identity', () => {
    const r1A: Row = { eventId: 'dup' } as Row;
    const r1B: Row = { eventId: 'dup' } as Row;
    const { service, selection } = makeService([]);

    service.toggleRow(r1A);
    expect(selection().selected).toEqual([r1A]);

    service.toggleRow(r1B);
    expect(selection().selected).toEqual([r1A, r1B]);

    service.toggleRow(r1A);
    expect(selection().selected).toEqual([r1B]);
  });

  it('publishes a fresh SelectionModel instance after each toggle', () => {
    const rows = [{ eventId: '1' } as Row];
    const { service, selection } = makeService(rows);

    const initialModel = selection();
    service.toggleAllRows();
    const afterToggleAll = selection();
    expect(afterToggleAll).not.toBe(initialModel);

    service.toggleRow(rows[0]);
    const afterToggleRow = selection();
    expect(afterToggleRow).not.toBe(afterToggleAll);
  });
});
