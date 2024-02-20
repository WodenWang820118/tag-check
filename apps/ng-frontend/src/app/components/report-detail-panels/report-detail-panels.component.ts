import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Observable, combineLatest, of, tap } from 'rxjs';
import { ReportDetails } from '../../models/report.interface';
import { MatExpansionModule } from '@angular/material/expansion';
import { RecordingService } from '../../services/api/recording/recording.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { SpecService } from '../../services/api/spec/spec.service';

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
      <mat-expansion-panel
        hideToggle
        (opened)="switchSpecEdit()"
        (closed)="switchSpecEdit()"
      >
        <mat-expansion-panel-header>
          <mat-panel-title> DataLayer Spec </mat-panel-title>
          <mat-panel-description>
            @if (specEdit) {
            <mat-icon (click)="edit($event)">edit</mat-icon>
            }
          </mat-panel-description>
        </mat-expansion-panel-header>
        <ng-template matExpansionPanelContent>
          <pre class="json">{{ spec$ | async | json }}</pre>
        </ng-template>
      </mat-expansion-panel>

      <mat-expansion-panel
        hideToggle
        (opened)="switchRecordingEdit()"
        (closed)="switchRecordingEdit()"
      >
        <mat-expansion-panel-header>
          <mat-panel-title> Chrome Recording </mat-panel-title>
          <mat-panel-description>
            <!-- <mat-icon>chevron_right</mat-icon> -->
            @if (recordingEdit) {
            <mat-icon matTooltip="Edit" (click)="edit($event)">edit</mat-icon>
            }
          </mat-panel-description>
        </mat-expansion-panel-header>
        <ng-template matExpansionPanelContent>
          <pre class="json">{{ recording$ | async | json }}</pre>
        </ng-template>
      </mat-expansion-panel>

      <mat-expansion-panel hideToggle>
        <mat-expansion-panel-header>
          <mat-panel-title> Test Result </mat-panel-title>
        </mat-expansion-panel-header>
        <ng-template matExpansionPanelContent>
          <pre class="json">{{
            (reportDetails$ | async)?.dataLayer | json
          }}</pre>
        </ng-template>
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
  spec$!: Observable<any>;
  specEdit = false;
  recordingEdit = false;

  constructor(
    private recordingService: RecordingService,
    private specService: SpecService,
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

  edit(event: Event) {
    event.stopPropagation();
    console.log('edit');
  }
}
