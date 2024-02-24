import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Observable, combineLatest, of, tap } from 'rxjs';
import { IReportDetails } from '../../models/report.interface';
import { MatExpansionModule } from '@angular/material/expansion';
import { RecordingService } from '../../services/api/recording/recording.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { SpecService } from '../../services/api/spec/spec.service';
import { ReportService } from '../../services/api/report/report.service';

@Component({
  selector: 'app-report-datail-panels',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatTooltipModule,
  ],
  templateUrl: './report-detail-panels.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./report-detail-panels.component.scss'],
})
export class ReportDetailPanelsComponent implements OnInit {
  @Input() eventName!: string | undefined;
  @Input() reportDetails$!: Observable<IReportDetails | undefined>;
  recording$!: Observable<any>;
  spec$!: Observable<any>;
  specEdit = false;
  recordingEdit = false;

  constructor(
    private recordingService: RecordingService,
    private specService: SpecService,
    private reportService: ReportService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    combineLatest([
      this.route.params,
      this.route.parent?.params || of({ projectSlug: '' }),
    ])
      .pipe(
        tap(([params, parentParams]) => {
          if (params && parentParams) {
            this.spec$ = this.specService.getSpec(
              parentParams['projectSlug'],
              params['eventName']
            );

            this.recording$ = this.recordingService.getRecordingDetails(
              parentParams['projectSlug'],
              params['eventName']
            );
          }
        })
      )
      .subscribe();
  }

  switchSpecEdit() {
    this.specEdit = !this.specEdit;
  }

  switchRecordingEdit() {
    this.recordingEdit = !this.recordingEdit;
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    this.reportService.readJsonFileContent(file);
  }

  edit(event: Event) {
    event.stopPropagation();
    console.log('edit');
  }
}
