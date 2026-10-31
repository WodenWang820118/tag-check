import { UploadSpecService } from './../../../../shared/services/upload-spec/upload-spec.service';
import {
  Component,
  signal,
  ChangeDetectionStrategy,
  effect,
  inject,
  untracked
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProjectDataSourceService } from '../../../../shared/services/data-source/project-data-source.service';
import {
  MatButtonToggleChange,
  MatButtonToggleModule
} from '@angular/material/button-toggle';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';
import { ReportTableDataSourceModelService } from '../../services/report-table-data-source-model/report-table-data-source-model.service';

import { ReportTableFacadeService } from '../report-table/report-table-facade.service';
import { BatchRunService } from '../../services/batch-run/batch-run.service';
import { RunHeadlessService } from '../../services/run-headless/run-headless.service';
import type { ScheduleJson } from '../../../../shared/services/api/schedules/schedules.service';
import {
  ScheduleDialogComponent,
  ScheduleDialogData
} from '../schedule-dialog/schedule-dialog.component';

/**
 * The tests table's toolbar: add tests, run the selected ones as a batch or
 * schedule them, delete, stop the running test, run headless, search and
 * bookmark.
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
    MatSlideToggleModule,
    MatButtonToggleModule
  ],
  templateUrl: './report-table-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./report-table-toolbar.component.scss']
})
export class ReportTableToolbarComponent {
  private readonly dataSourceService = inject(ProjectDataSourceService);
  private readonly testRunningFacade = inject(TestRunningFacadeService);
  private readonly uploadSpecService = inject(UploadSpecService);
  private readonly reportTableDataSourceModelService = inject(
    ReportTableDataSourceModelService
  );
  private readonly reportTableFacadeService = inject(ReportTableFacadeService);
  private readonly batchRunService = inject(BatchRunService);
  readonly runHeadlessService = inject(RunHeadlessService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly isSearchVisible = signal(false);

  constructor() {
    // The Run headless toggle shows the choice for the table's project.
    effect(() => {
      const projectSlug = this.reportTableFacadeService.projectSlug$();
      if (projectSlug) {
        untracked(() => this.runHeadlessService.load(projectSlug));
      }
    });
  }

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

  /**
   * Enqueues the selected tests, in the order the table shows them, as a
   * batch the backend runs, headless or not as the toggle says.
   */
  async runSelected() {
    const projectSlug = this.reportTableFacadeService.projectSlug$();
    const eventIds = this.selectedEventIds();
    if (!projectSlug || eventIds.length === 0 || !this.canRunSelected()) {
      return;
    }
    const error = await this.batchRunService.start(
      projectSlug,
      eventIds,
      this.runHeadlessService.headless()
    );
    if (error) {
      this.notify(error);
    }
  }

  /** Opens the schedule dialog for the selected tests, in table order. */
  async scheduleSelected(): Promise<void> {
    const projectSlug = this.reportTableFacadeService.projectSlug$();
    const eventIds = this.selectedEventIds();
    if (!projectSlug || eventIds.length === 0) {
      return;
    }
    const dialogRef = this.dialog.open<
      ScheduleDialogComponent,
      ScheduleDialogData,
      ScheduleJson
    >(ScheduleDialogComponent, { data: { projectSlug, eventIds } });

    try {
      const saved = await firstValueFrom(dialogRef.afterClosed());
      if (saved) {
        this.notify(
          `Schedule "${saved.name}" saved. The Schedules page lists it.`
        );
      }
    } catch {
      // dialog dismissed
    }
  }

  setRunHeadless(headless: boolean) {
    this.runHeadlessService.set(headless);
  }

  isRunningTest() {
    return this.testRunningFacade.isRunningTest$();
  }

  private selectedEventIds(): string[] {
    const selection = this.reportTableDataSourceModelService.selection();
    return this.reportTableDataSourceModelService
      .dataSource()
      .filteredData.filter((row) => selection.isSelected(row))
      .map(({ eventId }) => eventId);
  }

  private notify(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 6000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }
}
