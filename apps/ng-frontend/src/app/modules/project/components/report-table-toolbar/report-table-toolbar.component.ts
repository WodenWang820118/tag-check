import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { catchError, Subject, takeUntil } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ProjectDataSourceService } from '../../../../shared/services/project-data-source/project-data-source.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonToggleChange,
  MatButtonToggleModule,
} from '@angular/material/button-toggle';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';

@Component({
  selector: 'app-report-table-toolbar',
  standalone: true,
  imports: [
    NgIf,
    RouterLink,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonToggleModule,
  ],
  templateUrl: './report-table-toolbar.component.html',
  styleUrls: ['./report-table-toolbar.component.scss'],
})
export class ReportTableToolbarComponent implements OnDestroy {
  isSearchVisible = false;
  destroy$ = new Subject<void>();
  @Output() add = new EventEmitter<void>();
  constructor(
    private dataSourceService: ProjectDataSourceService,
    private testRunningFacade: TestRunningFacadeService
  ) { }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceService.setFilter(filterValue);
  }

  deleteSelected() {
    this.dataSourceService.deleteSelected();
  }

  preventNavigationSelected() {
    this.dataSourceService.preventNavigationSelected();
  }

  onToggleChange(event: MatButtonToggleChange) {
    console.log(event.value);
    if (event.value === 'search') {
      this.isSearchVisible = !this.isSearchVisible;
    }
  }

  emitAddEvent() {
    this.add.emit();
  }

  stopOperation() {
    this.testRunningFacade
      .stopOperation()
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Error stopping operation:', error);
          throw error;
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
