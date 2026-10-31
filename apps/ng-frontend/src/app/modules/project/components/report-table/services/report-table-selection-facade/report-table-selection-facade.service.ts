import { Injectable } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { IReportDetails } from '@utils';
import { ReportTableDataSourceModelService } from '../../../../services/report-table-data-source-model/report-table-data-source-model.service';
import {
  getCurrentPageRows,
  togglePageSelection,
  toggleRowSelection
} from '../../../../../../shared/services/utils/table-selection';

/**
 * Selection in the tests table. Select all acts on the rows of the
 * current page, as filtered and sorted. Each change sets a new
 * SelectionModel, so the signal notifies.
 */
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
    const pageRows = getCurrentPageRows(ds);
    const nextSelected = togglePageSelection(sel.selected, pageRows);
    const newModel = new SelectionModel<IReportDetails>(true, nextSelected);
    this.reportTableDataSourceModelService.selection.set(newModel);
  }

  /** Toggle selection of a single row immutably */
  toggleRow(row: IReportDetails): void {
    const prevModel = this.reportTableDataSourceModelService.selection();
    const newSelected = toggleRowSelection(prevModel.selected, row);
    const newModel = new SelectionModel<IReportDetails>(true, newSelected);
    this.reportTableDataSourceModelService.selection.set(newModel);
  }

  checkboxLabel(row?: IReportDetails): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    // Test rows have no position; the test name tells rows apart.
    return `${
      this.reportTableDataSourceModelService.selection().isSelected(row)
        ? 'deselect'
        : 'select'
    } ${row.testName || row.eventName}`;
  }

  // Whether all rows on the current page are selected
  isAllSelected(): boolean {
    const ds = this.reportTableDataSourceModelService.dataSource();
    const sel = this.reportTableDataSourceModelService.selection();
    const pageRows = getCurrentPageRows(ds);
    return (
      pageRows.length > 0 &&
      pageRows.every((r: IReportDetails) => sel.isSelected(r))
    );
  }
  //#endregion
}
