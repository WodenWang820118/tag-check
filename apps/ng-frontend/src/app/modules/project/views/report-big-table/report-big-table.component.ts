import { Component } from '@angular/core';
import { ReportTableComponent } from '../../components/report-table/report-table.component';
import { ReportTableToolbarComponent } from '../../components/report-table-toolbar/report-table-toolbar.component';

@Component({
  selector: 'app-report-big-table',
  standalone: true,
  imports: [ReportTableComponent, ReportTableToolbarComponent],
  templateUrl: './report-big-table.component.html',
  styleUrls: ['./report-big-table.component.scss'],
})
export class ReportBigTableComponent {}
