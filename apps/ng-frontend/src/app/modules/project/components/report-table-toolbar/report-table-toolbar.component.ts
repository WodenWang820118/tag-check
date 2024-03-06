import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Project } from '../../../../shared/models/project.interface';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ProjectDataSourceService } from '../../../../shared/services/project-data-source/project-data-source.service';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-report-table-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatIconModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    RouterModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './report-table-toolbar.component.html',
  styleUrls: ['./report-table-toolbar.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ReportTableToolbarComponent implements OnDestroy {
  @Input() project$!: Observable<Project>;
  @Output() gtmPreviewModeEmitter = new EventEmitter<boolean>();
  gtmPreviewModeControl = new FormControl(true);
  gtmPreviewMode = false;

  destroy$ = new Subject<void>();
  constructor(private dataSourceService: ProjectDataSourceService) {}

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceService.setFilter(filterValue);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
