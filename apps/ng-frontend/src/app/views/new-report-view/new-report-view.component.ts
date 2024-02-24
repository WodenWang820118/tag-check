import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  Subject,
  combineLatest,
  forkJoin,
  map,
  mergeMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';
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
import { EditorComponent } from '../../components/editor/editor.component';
import { EditorService } from '../../services/editor/editor.service';
import { SpecService } from '../../services/api/spec/spec.service';
import { ReportDetails } from './report-details';
import { IReportDetails } from '../../models/report.interface';
import { ErrorDialogComponent } from '../../components/error-dialog/error-dialog.component';
import { MatDialog } from '@angular/material/dialog';

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
    EditorComponent,
    ErrorDialogComponent,
  ],
  templateUrl: './new-report-view.component.html',
  styleUrls: ['./new-report-view.component.scss'],
})
export class NewReportViewComponent implements OnInit, OnDestroy {
  exampleInputJson = {
    event: 'page_view',
    page_path: '$page_path',
    page_title: '$page_title',
    page_location: '$page_location',
  };

  reportForm = this.fb.group({
    projectSlug: ['', Validators.required],
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
    this.route.params
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
      this.editorService.editor$.recordingJsonEditor,
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
      this.editorService.editor$.recordingJsonEditor,
    ])
      .pipe(
        takeUntil(this.destroy$),
        map(([specEditor, recordingEditor]) => {
          const specContent = specEditor.state.doc.toString();
          const recordingContent = recordingEditor.state.doc.toString();
          const projectSlug = this.reportForm.get('projectSlug')?.value;

          if (specContent && projectSlug) {
            const eventName = JSON.parse(specContent).event;
            const reportDetails: IReportDetails = new ReportDetails(eventName);

            return {
              projectSlug,
              eventName,
              specContent,
              recordingContent,
              reportDetails,
            };
          } else {
            this.dialog.open(ErrorDialogComponent, {
              data: {
                message: 'Spec content is required and cannot be empty.',
              },
            });
            throw new Error('Spec content is required and cannot be empty.');
          }
        }),
        mergeMap(
          ({
            projectSlug,
            eventName,
            specContent,
            recordingContent,
            reportDetails,
          }) =>
            forkJoin([
              this.reportService.addReport(projectSlug, reportDetails),
              this.recordingService.addRecording(
                projectSlug,
                eventName,
                recordingContent
              ),
              this.specService.addSpec(projectSlug, specContent),
            ]).pipe(
              tap(() => {
                this.projectDataSourceService
                  .connect()
                  .pipe(
                    take(1),
                    tap((data) => {
                      this.projectDataSourceService.setData([
                        ...data,
                        reportDetails,
                      ]);
                    })
                  )
                  .subscribe();
              })
            )
        )
      )
      .subscribe({
        next: () => {
          console.log('Report and all related data successfully uploaded');
          this.location.back();
        },
        error: (err) => console.error('Error uploading report:', err),
      });
  }

  ngOnDestroy() {
    console.log('Unsubscribing from new-report-view');
    this.destroy$.next();
    this.destroy$.complete();
  }
}
