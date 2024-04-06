import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReportTableComponent } from '../../components/report-table/report-table.component';
import { ToolbarComponent } from '../../../../shared/components/toolbar/toolbar.component';
import { ReportTableToolbarComponent } from '../../components/report-table-toolbar/report-table-toolbar.component';

@Component({
  selector: 'app-project-view',
  standalone: true,
  imports: [
    CommonModule,
    ReportTableComponent,
    ToolbarComponent,
    ReportTableComponent,
    ReportTableToolbarComponent,
  ],
  templateUrl: './report-view.component.html',
  styleUrls: ['./report-view.component.scss'],
})
export class ReportViewComponent {}
