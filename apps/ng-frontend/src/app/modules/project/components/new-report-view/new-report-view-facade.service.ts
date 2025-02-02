import { DestroyRef, Injectable } from '@angular/core';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { ErrorDialogComponent } from '@ui';
import { IReportDetails, ReportDetailsDto } from '@utils';
import {
  tap,
  combineLatest,
  take,
  map,
  mergeMap,
  forkJoin,
  catchError,
  switchMap,
  throwError
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EditorService } from '../../../../shared/services/editor/editor.service';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Location } from '@angular/common';
import { v4 as uuidv4 } from 'uuid';
import { RecordingService } from '../../../../shared/services/api/recording/recording.service';
import { SpecService } from '../../../../shared/services/api/spec/spec.service';
import { ProjectDataSourceService } from '../../../../shared/services/data-source/project-data-source.service';
import { UploadSpecService } from '../../../../shared/services/upload-spec/upload-spec.service';

@Injectable({
  providedIn: 'root'
})
export class NewReportViewFacadeService {
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

  constructor(
    private reportService: ReportService,
    private destroyedRef: DestroyRef,
    private editorService: EditorService,
    private fb: FormBuilder,
    private location: Location,
    private dialog: MatDialog,
    private recordingService: RecordingService,
    private specService: SpecService,
    private projectDataSourceService: ProjectDataSourceService,
    private uploadSpecService: UploadSpecService
  ) {}

  cancel() {
    this.location.back();
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file: File | null = target.files?.[0] || null;
    if (file) {
      this.recordingService.readRecordingJsonFileContent(file);
      const recordingContent = this.recordingService.recordingContent$();
      if (recordingContent) {
        this.editorService.setContent(
          'recordingJson',
          JSON.stringify(recordingContent)
        );
      }
    }
  }

  setEditorContent() {
    combineLatest([
      this.editorService.editor$.specJsonEditor,
      this.editorService.editor$.recordingJsonEditor
    ])
      .pipe(
        takeUntilDestroyed(this.destroyedRef),
        tap(([specEditor, recordingEditor]) => {
          const specContent = specEditor.state.doc.toString();
          const recordingContent = recordingEditor.state.doc.toString();

          this.editorService.setContent('specJson', specContent);
          this.editorService.setContent('recordingJson', recordingContent);
        })
      )
      .subscribe();
  }

  uploadReport(projectSlug: string) {
    return combineLatest([
      this.editorService.editor$.specJsonEditor,
      this.editorService.editor$.recordingJsonEditor
    ]).pipe(
      map(([specEditor, recordingEditor]) => {
        if (!this.reportForm.controls['testName'].value)
          throw new Error('Test name is required');

        const specContent = specEditor.state.doc.toString();
        const recordingContent = recordingEditor.state.doc.toString();
        const testName = this.reportForm.controls['testName'].value;
        const eventId = uuidv4();

        if (specContent && projectSlug) {
          const eventName = JSON.parse(specContent).event as string;

          const reportDetails: IReportDetails = new ReportDetailsDto({
            eventId: eventId,
            testName: testName,
            eventName: eventName
          });

          this.projectDataSourceService.connect().pipe(
            take(1),
            tap((data) => {
              this.projectDataSourceService.setData([...data, reportDetails]);
              this.uploadSpecService.completeUpload();
            }),
            catchError((error) => {
              console.error('Error updating project data source:', error);
              return error;
            })
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
      switchMap(
        ({
          projectSlug,
          eventId,
          eventName,
          specContent,
          recordingContent,
          reportDetails
        }) => {
          return this.reportService.addReport(
            projectSlug,
            eventId,
            reportDetails,
            JSON.parse(recordingContent),
            JSON.parse(specContent)
          );
        }
      )
    );
  }

  completeUpload() {
    this.uploadSpecService.completeUpload();
  }
}
