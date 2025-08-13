import { Component, OnDestroy } from '@angular/core';
import { ReportTableComponent } from '../../components/report-table/report-table.component';
import { ReportTableToolbarComponent } from '../../components/report-table-toolbar/report-table-toolbar.component';
import { SlideUploadComponent } from '../../components/slide-upload/slide-upload.component';
import { SlideImportComponent } from '../../components/slide-import/slide-import.component';
import { UploadSpecService } from '../../../../shared/services/upload-spec/upload-spec.service';
@Component({
  selector: 'app-report-big-table',
  standalone: true,
  imports: [
    ReportTableComponent,
    ReportTableToolbarComponent,
    SlideUploadComponent,
    SlideImportComponent
  ],
  templateUrl: './report-big-table.component.html',
  styleUrls: ['./report-big-table.component.scss']
})
export class ReportBigTableComponent implements OnDestroy {
  constructor(private readonly uploadSpecService: UploadSpecService) {}

  ngOnDestroy(): void {
    // resetting the upload state
    this.uploadSpecService.completeUpload();
  }
}
