import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { Project, TestCase } from '../../models/project.interface';
import { MatExpansionModule } from '@angular/material/expansion';
import { RecordingService } from '../../services/recording/recording.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-test-datail-panels',
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
            (testCase$ | async)?.dataLayerSpec | json
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
        <pre class="json">{{ (testCase$ | async)?.dataLayer | json }}</pre>
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
export class TestDetailPanelsComponent implements OnInit {
  @Input() eventName!: string | undefined;
  @Input() testCase$!: Observable<TestCase | undefined>;
  @Input() project$!: Observable<Project | undefined>;
  recording$!: Observable<any> | undefined;

  constructor(private recordingService: RecordingService) {}

  ngOnInit() {
    this.recording$ = this.recordingService.getRecordingByEventName(
      this.eventName
    );
  }
}
