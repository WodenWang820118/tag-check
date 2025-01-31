import { DestroyRef, Injectable } from '@angular/core';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { ErrorDialogComponent } from '@ui';
import { IReportDetails, ReportDetailsDto } from '@utils';
import {
  takeUntil,
  tap,
  combineLatest,
  take,
  map,
  mergeMap,
  forkJoin,
  catchError
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
import { Router } from '@angular/router';

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
    private router: Router
  ) {}

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
          takeUntilDestroyed(this.destroyedRef),
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
      take(1),
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
            this.reportService.addReport(projectSlug, eventId, reportDetails),
            this.recordingService.addRecording(
              projectSlug,
              eventId,
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
                    console.error('Error updating project data source:', error);
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
    );
  }
}
