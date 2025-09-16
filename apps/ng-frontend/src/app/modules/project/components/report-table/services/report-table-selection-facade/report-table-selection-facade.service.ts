import { Injectable } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { IReportDetails } from '@utils';
import { ReportTableDataSourceModelService } from '../../../../services/report-table-data-source-model/report-table-data-source-model.service';

@Injectable({ providedIn: 'root' })
export class ReportTableSelectionFacadeService {
  constructor(
    private readonly reportTableDataSourceModelService: ReportTableDataSourceModelService
  ) {}

  //#region Toggle helpers
  /** Toggle selection of all rows immutably to trigger signal updates */
  toggleAllRows(): void {
    const ds = this.reportTableDataSourceModelService.dataSource();
    const sel = this.reportTableDataSourceModelService.selection();

    // Determine working dataset: filtered first, otherwise full data
    const working =
      (ds as unknown as { filteredData?: IReportDetails[] }).filteredData ??
      ds.data;
    // Align order with displayed sort
    const sorted = ds.sort ? ds.sortData(working, ds.sort) : working;

    // Compute current page slice
    const pageIndex = ds.paginator?.pageIndex ?? 0;
    const pageSize = ds.paginator?.pageSize ?? sorted.length;
    const start = pageIndex * pageSize;
    const end = Math.min(start + pageSize, sorted.length);
    const pageRows = sorted.slice(start, end);

    const allPageSelected = pageRows.every((r: IReportDetails) =>
      sel.isSelected(r)
    );

    let nextSelected: IReportDetails[];
    if (allPageSelected) {
      const pageSet = new Set(pageRows);
      nextSelected = sel.selected.filter(
        (r: IReportDetails) => !pageSet.has(r)
      );
    } else {
      const set = new Set(sel.selected);
      pageRows.forEach((r: IReportDetails) => set.add(r));
      nextSelected = Array.from(set.values());
    }

    const newModel = new SelectionModel<IReportDetails>(true, nextSelected);
    this.reportTableDataSourceModelService.selection.set(newModel);
  }

  /** Toggle selection of a single row immutably */
  toggleRow(row: IReportDetails) {
    const prevModel = this.reportTableDataSourceModelService.selection();
    const prevSelected = prevModel.selected;
    const isSelected = prevModel.isSelected(row);
    const newSelected = isSelected
      ? prevSelected.filter((r: IReportDetails) => r !== row)
      : [...prevSelected, row];
    const newModel = new SelectionModel<IReportDetails>(true, newSelected);
    this.reportTableDataSourceModelService.selection.set(newModel);
  }

  checkboxLabel(row?: IReportDetails): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${
      this.reportTableDataSourceModelService.selection().isSelected(row)
        ? 'deselect'
        : 'select'
    } row ${row.position + 1}`;
  }

  // Whether all rows on the current page are selected
  isAllSelected(): boolean {
    const ds = this.reportTableDataSourceModelService.dataSource();
    const sel = this.reportTableDataSourceModelService.selection();

    const working =
      (ds as unknown as { filteredData?: IReportDetails[] }).filteredData ??
      ds.data;
    const sorted = ds.sort ? ds.sortData(working, ds.sort) : working;
    const pageIndex = ds.paginator?.pageIndex ?? 0;
    const pageSize = ds.paginator?.pageSize ?? sorted.length;
    const start = pageIndex * pageSize;
    const end = Math.min(start + pageSize, sorted.length);
    const pageRows = sorted.slice(start, end);
    return (
      pageRows.length > 0 &&
      pageRows.every((r: IReportDetails) => sel.isSelected(r))
    );
  }
  //#endregion
}
