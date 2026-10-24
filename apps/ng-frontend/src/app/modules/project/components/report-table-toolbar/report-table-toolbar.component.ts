import { UploadSpecService } from './../../../../shared/services/upload-spec/upload-spec.service';
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ProjectDataSourceService } from '../../../../shared/services/data-source/project-data-source.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonToggleChange,
  MatButtonToggleModule
} from '@angular/material/button-toggle';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';
import { ReportTableDataSourceModelService } from '../../services/report-table-data-source-model/report-table-data-source-model.service';

import { ReportTableFacadeService } from '../report-table/report-table-facade.service';
import { BatchRunService } from '../../services/batch-run/batch-run.service';

/**
 * The tests table's toolbar: add tests, run the selected ones as a
 * batch, delete, stop the running test, search and bookmark.
 */
@Component({
  selector: 'app-report-table-toolbar',
  standalone: true,
  imports: [
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonToggleModule
  ],
  templateUrl: './report-table-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./report-table-toolbar.component.scss']
})
export class ReportTableToolbarComponent {
  // Signals
  isSearchVisible = signal(false);

  constructor(
    private readonly dataSourceService: ProjectDataSourceService,
    private readonly testRunningFacade: TestRunningFacadeService,
    private readonly uploadSpecService: UploadSpecService,
    private readonly reportTableDataSourceModelService: ReportTableDataSourceModelService,
    private readonly reportTableFacadeService: ReportTableFacadeService,
    private readonly batchRunService: BatchRunService
  ) {}

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceService.setFilterSignal(filterValue);
  }

  deleteSelected() {
    this.dataSourceService.setDeletedSignal(true);
  }

  isSavingNavigation() {
    return this.dataSourceService.getPreventNavigationSignal();
  }

  preventNavigationSelected() {
    if (
      !this.hasSelection() ||
      this.isRunningTest() ||
      this.isSavingNavigation()
    )
      return;
    this.dataSourceService.setPreventNavigationSignal(true);
  }

  onToggleChange(event: MatButtonToggleChange) {
    if (event.value === 'search') {
      this.isSearchVisible.update((prev) => !prev);
    }
  }

  async stopOperation() {
    await firstValueFrom(this.testRunningFacade.stopOperation());
  }

  emitAddEvent() {
    this.uploadSpecService.startUpload();
  }

  hasSelection() {
    return this.reportTableDataSourceModelService.selection().hasValue();
  }

  canRunSelected() {
    return (
      this.hasSelection() &&
      !this.isRunningTest() &&
      !this.batchRunService.isRunning()
    );
  }

  /** Runs the selected tests in the order the table shows them. */
  runSelected() {
    const projectSlug = this.reportTableFacadeService.projectSlug$();
    const selection = this.reportTableDataSourceModelService.selection();
    const tests = this.reportTableDataSourceModelService
      .dataSource()
      .filteredData.filter((row) => selection.isSelected(row))
      .map(({ eventId, eventName }) => ({ eventId, eventName }));
    if (projectSlug && tests.length > 0 && this.canRunSelected()) {
      void this.batchRunService.start(projectSlug, tests);
    }
  }

  isRunningTest() {
    return this.testRunningFacade.isRunningTest$();
  }
}
