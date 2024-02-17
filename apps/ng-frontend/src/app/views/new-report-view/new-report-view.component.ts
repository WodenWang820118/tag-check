import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ProjectService } from '../../services/api/project/project.service';
import { take, tap } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { RecordingService } from '../../services/api/recording/recording.service';
import { ReportService } from '../../services/api/report/report.service';
import { ProjectDataSourceService } from '../../services/project-data-source/project-data-source.service';
import { ReportDetails } from '../../models/report.interface';

@Component({
  selector: 'app-new-report-view',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    RouterModule,
  ],
  template: `
    <div class="new-report">
      <form
        class="new-report__form"
        [formGroup]="reportForm"
        (ngSubmit)="uploadReport()"
      >
        <mat-form-field class="new-report__form__field">
          <mat-label>Project Slug</mat-label>
          <input matInput formControlName="projectSlug" />
        </mat-form-field>

        <mat-form-field class="new-report__form__field">
          <mat-label>Spec</mat-label>
          <textarea
            style="min-height: 150px;"
            matInput
            formControlName="spec"
            [placeholder]="specPlaceholder | json"
          ></textarea>
        </mat-form-field>

        <!-- TODO: could be plain JSON test or file upload -->
        <mat-form-field class="new-report__form__field">
          <mat-label>Recording</mat-label>
          <textarea matInput formControlName="recording"></textarea>
        </mat-form-field>
        <!-- TODO: upload function -->
        <button type="button" mat-raised-button style="margin-bottom: 1rem;">
          Upload
        </button>
        <div class="new-report__form__actions">
          <button type="button" mat-raised-button>Cancel</button>
          <button type="submit" mat-raised-button color="primary">
            Submit
          </button>
        </div>
      </form>
    </div>
  `,
  styles: `
    .new-report {
      padding: 2rem 10rem;
      &__form {
        &__field {
          width: 100%;
        }

        &__actions {
          display: flex;
          flex-direction: row;
          justify-content: flex-start;
          gap: 1rem;
        }
      }
    }
  `,
})
export class NewReportViewComponent implements OnInit {
  specPlaceholder = {
    event: 'page_view',
    page_path: '$page_path',
    page_title: '$page_title',
    page_location: '$page_location',
  };

  reportForm = this.fb.group({
    projectSlug: ['', Validators.required],
    spec: [JSON.stringify(this.specPlaceholder, null, 2), Validators.required],
    recording: [''],
  });

  constructor(
    private projectService: ProjectService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private recordingService: RecordingService,
    private reportService: ReportService,
    private location: Location,
    private projectDataSourceService: ProjectDataSourceService
  ) {}

  ngOnInit() {
    this.route.params
      .pipe(
        tap((params) => {
          if (params) {
            // please refer to the app.routes.ts file
            console.log('params', params);
            this.reportForm.controls.projectSlug.setValue(
              params['projectSlug']
            );
            this.reportForm.controls.projectSlug.disable();
          }
        })
      )
      .subscribe();
  }

  uploadReport() {
    if (this.reportForm.valid) {
      console.log('Form: ', this.reportForm.value);

      const specValue = JSON.parse(
        this.reportForm.controls.spec.value as string
      );

      const reportDetails: ReportDetails = {
        eventName: specValue,
        passed: false,
        dataLayerSpec: specValue,
        incorrectInfo: [],
        completedTime: new Date(),
        dataLayer: {},
        message: '',
      };

      // 1) adding content in the report service
      this.reportService.addReport(this.reportForm, reportDetails).subscribe();
      // 2) adding content in the recording service
      this.recordingService.addRecording(this.reportForm).subscribe();
      // 3) adding content in the project data source service to be displayed in the table
      this.projectDataSourceService
        .connect()
        .pipe(
          take(1),
          tap((data) => {
            console.log('Data: ', data);
            this.projectDataSourceService.setData([...data, reportDetails]);
          })
        )
        .subscribe();

      if (!this.reportForm.controls.recording.value) {
        this.location.back();
        return;
      }

      this.location.back();
    }
  }
}
