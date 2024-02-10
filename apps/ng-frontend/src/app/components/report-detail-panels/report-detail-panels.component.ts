import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Observable, combineLatest, of, switchMap } from 'rxjs';
import { ReportDetails } from '../../models/report.interface';
import { MatExpansionModule } from '@angular/material/expansion';
import { RecordingService } from '../../services/api/recording/recording.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProjectService } from '../../services/api/project/project.service';
import { ActivatedRoute } from '@angular/router';

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
  template: `<div class="test-detail-panels">
    <mat-accordion class=".example-headers-align" multi>
      <mat-expansion-panel hideToggle>
        <mat-expansion-panel-header>
          <mat-panel-title> DataLayer Spec </mat-panel-title>
          <mat-panel-description>
            <mat-icon>chevron_right</mat-icon>
            <mat-icon>edit</mat-icon>
          </mat-panel-description>
        </mat-expansion-panel-header>
        <mat-panel-description>
          <pre class="json">{{
            (reportDetails$ | async)?.dataLayerSpec | json
          }}</pre>
        </mat-panel-description>
      </mat-expansion-panel>

      <mat-expansion-panel hideToggle>
        <mat-expansion-panel-header>
          <mat-panel-title> Chrome Recording </mat-panel-title>
          <mat-panel-description>
            <mat-icon>chevron_right</mat-icon>
            <mat-icon matTooltip="Edit">edit</mat-icon>
          </mat-panel-description>
        </mat-expansion-panel-header>
        <mat-panel-description>
          <pre class="json">{{ recording$ | async | json }}</pre>
        </mat-panel-description>
      </mat-expansion-panel>

      <mat-expansion-panel hideToggle>
        <mat-expansion-panel-header>
          <mat-panel-title> Test Result </mat-panel-title>
          <mat-panel-description>
            <mat-icon>chevron_right</mat-icon>
            <mat-icon>edit</mat-icon>
          </mat-panel-description>
        </mat-expansion-panel-header>
        <pre class="json">{{ (reportDetails$ | async)?.dataLayer | json }}</pre>
      </mat-expansion-panel>
    </mat-accordion>
  </div>`,
  encapsulation: ViewEncapsulation.None,
  styles: `
    .json {
      overflow: auto;
    }

    .example-headers-align {
      justify-content: space-between;
      align-items: center;
    }

    .mat-expansion-panel-header-description {
      justify-content: flex-end;
      align-items: center;
    }
  `,
})
export class ReportDetailPanelsComponent implements OnInit {
  @Input() eventName!: string | undefined;
  @Input() reportDetails$!: Observable<ReportDetails | undefined>;
  recording$!: Observable<any>;

  constructor(
    private projectService: ProjectService,
    private recordingService: RecordingService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.recording$ = combineLatest([
      this.projectService.currentProject$,
      this.reportDetails$,
    ]).pipe(
      switchMap(([project, reportDetails]) => {
        if (!project || !reportDetails) return of(undefined);
        console.log('project', project);
        console.log('reportDetails', reportDetails);
        return this.recordingService.getRecordingDetails(
          project.projectSlug,
          reportDetails?.eventName
        );
      })
    );
  }
}
