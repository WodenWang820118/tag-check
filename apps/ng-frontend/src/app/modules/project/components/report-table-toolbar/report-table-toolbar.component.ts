import { UploadSpecService } from './../../../../shared/services/upload-spec/upload-spec.service';
import { Component, signal } from '@angular/core';
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
  styleUrls: ['./report-table-toolbar.component.scss']
})
export class ReportTableToolbarComponent {
  // Signals
  isSearchVisible = signal(false);

  constructor(
    private dataSourceService: ProjectDataSourceService,
    private testRunningFacade: TestRunningFacadeService,
    private uploadSpecService: UploadSpecService,
    private reportTableDataSourceModelService: ReportTableDataSourceModelService
  ) {}

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceService.setFilterSignal(filterValue);
  }

  deleteSelected() {
    this.dataSourceService.setDeletedSignal(true);
  }

  preventNavigationSelected() {
    this.dataSourceService.setPreventNavigationSignal(true);
  }

  onToggleChange(event: MatButtonToggleChange) {
    console.log(event.value);
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

  isRunningTest() {
    return this.testRunningFacade.isRunningTest$();
  }
}
