import { Component, OnDestroy, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import {
  Subject,
  catchError,
  combineLatest,
  forkJoin,
  map,
  mergeMap,
  take,
  takeUntil,
  tap
} from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { RecordingService } from '../../../../shared/services/api/recording/recording.service';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { ProjectDataSourceService } from '../../../../shared/services/data-source/project-data-source.service';
import { EditorComponent } from '../../../../shared/components/editor/editor.component';
import { EditorService } from '../../../../shared/services/editor/editor.service';
import { SpecService } from '../../../../shared/services/api/spec/spec.service';
import { ReportDetailsDto, IReportDetails } from '@utils';
import { ErrorDialogComponent } from '../../../../shared/components/error-dialog/error-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-new-report-view',
  standalone: true,
  imports: [
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    EditorComponent
  ],
  templateUrl: './new-report-view.component.html',
  styleUrls: ['./new-report-view.component.scss']
})
export class NewReportViewComponent implements OnInit, OnDestroy {
  exampleInputJson = JSON.stringify({
    event: 'page_view',
    page_path: '$page_path',
    page_title: '$page_title',
    page_location: '$page_location'
  });

  reportForm = this.fb.group({
    projectSlug: ['', Validators.required],
    testName: ['', Validators.required]
  });

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private recordingService: RecordingService,
    private reportService: ReportService,
    private specService: SpecService,
    private location: Location,
    private projectDataSourceService: ProjectDataSourceService,
    private editorService: EditorService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.route.parent?.params
      .pipe(
        takeUntil(this.destroy$),
        tap((params) => {
          const projectSlug = params['projectSlug'];
          if (projectSlug) {
            this.reportForm.controls.projectSlug.setValue(projectSlug);
            this.reportForm.controls.projectSlug.disable();
          }
        })
      )
      .subscribe();
  }

  cancel() {
    this.location.back();
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file: File | null = target.files?.[0] || null;
    if (file) {
      this.reportService.readJsonFileContent(file);

      this.reportService.fileContent$
        .pipe(
          takeUntil(this.destroy$),
          tap((data) => {
            if (data) {
              this.editorService.setContent(
                'recordingJson',
                JSON.stringify(data)
              );
            }
          })
        )
        .subscribe();
    }
  }

  setEditorContent() {
    combineLatest([
      this.editorService.editor$.specJsonEditor,
      this.editorService.editor$.recordingJsonEditor
    ])
      .pipe(
        takeUntil(this.destroy$),
        tap(([specEditor, recordingEditor]) => {
          const specContent = specEditor.state.doc.toString();
          const recordingContent = recordingEditor.state.doc.toString();

          this.editorService.setContent('specJson', specContent);
          this.editorService.setContent('recordingJson', recordingContent);
        })
      )
      .subscribe();
  }

  uploadReport() {
    combineLatest([
      this.editorService.editor$.specJsonEditor,
      this.editorService.editor$.recordingJsonEditor
    ])
      .pipe(
        take(1),
        map(([specEditor, recordingEditor]) => {
          if (
            !this.reportForm.controls['testName'].value ||
            !this.reportForm.controls['projectSlug'].value
          )
            return {} as any;

          const specContent = specEditor.state.doc.toString();
          const recordingContent = recordingEditor.state.doc.toString();
          const projectSlug = this.reportForm.controls['projectSlug'].value;
          const testName = this.reportForm.controls['testName'].value;
          const eventId = uuidv4();

          if (specContent && projectSlug) {
            const eventName = JSON.parse(specContent).event as string;

            const reportDetails: IReportDetails = new ReportDetailsDto(
              eventId,
              testName,
              eventName
            );

            return {
              projectSlug,
              eventId,
              eventName,
              specContent,
              recordingContent,
              reportDetails
            };
          } else {
            this.dialog.open(ErrorDialogComponent, {
              data: {
                message: 'Spec content is required and cannot be empty.'
              }
            });
            throw new Error('Spec content is required and cannot be empty.');
          }
        }),
        mergeMap(
          ({
            projectSlug,
            eventId,
            eventName,
            specContent,
            recordingContent,
            reportDetails
          }) =>
            forkJoin([
              this.reportService.addReport(
                projectSlug,
                `${eventName}_${eventId}`,
                reportDetails
              ),
              this.recordingService.addRecording(
                projectSlug,
                `${eventName}_${eventId}`,
                recordingContent as string
              ),
              this.specService.addSpec(projectSlug, JSON.parse(specContent))
            ]).pipe(
              tap(() => {
                this.projectDataSourceService
                  .connect()
                  .pipe(
                    take(1),
                    tap((data) => {
                      this.projectDataSourceService.setData([
                        ...data,
                        reportDetails
                      ]);
                    }),
                    catchError((error) => {
                      console.error(
                        'Error updating project data source:',
                        error
                      );
                      return error;
                    })
                  )
                  .subscribe();
              })
            )
        ),
        catchError((error) => {
          console.error('Error uploading report:', error);
          return error;
        })
      )
      .subscribe({
        next: () => {
          console.log('Report and all related data successfully uploaded');
          this.location.back();
        },
        error: (err) => console.error('Error uploading report:', err)
      });
  }

  ngOnDestroy() {
    console.log('Unsubscribing from new-report-view');
    this.destroy$.next();
    this.destroy$.complete();
  }
}
