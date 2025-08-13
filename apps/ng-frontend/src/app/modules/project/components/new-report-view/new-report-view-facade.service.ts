import { DestroyRef, Injectable, inject } from '@angular/core';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { IReportDetails, ReportDetailsDto } from '@utils';
import {
  tap,
  combineLatest,
  take,
  map,
  switchMap,
  throwError,
  catchError
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EditorService } from '../../../../shared/services/editor/editor.service';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Location } from '@angular/common';
import { v4 as uuidv4 } from 'uuid';
import { RecordingService } from '../../../../shared/services/api/recording/recording.service';
import { ProjectDataSourceService } from '../../../../shared/services/data-source/project-data-source.service';
import { UploadSpecService } from '../../../../shared/services/upload-spec/upload-spec.service';
import { LoggerService } from '../../../../shared/services/logger/logger.service'; // Create this service

@Injectable({
  providedIn: 'root'
})
export class NewReportViewFacadeService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private errorDialogComponentPromise: Promise<any> | null = null;
  private readonly logger = inject(LoggerService);

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
    private readonly reportService: ReportService,
    private readonly destroyedRef: DestroyRef,
    private readonly editorService: EditorService,
    private readonly fb: FormBuilder,
    private readonly location: Location,
    private readonly dialog: MatDialog,
    private readonly recordingService: RecordingService,
    private readonly projectDataSourceService: ProjectDataSourceService,
    private readonly uploadSpecService: UploadSpecService
  ) {
    // Initialize the component promise but don't await it yet
    this.initErrorDialogComponent();
  }

  private initErrorDialogComponent(): void {
    this.errorDialogComponentPromise = this.loadErrorDialogComponent();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async loadErrorDialogComponent(): Promise<any> {
    try {
      const module = await import('@ui');
      this.logger.info('ErrorDialogComponent loaded successfully');
      return module.ErrorDialogComponent;
    } catch (error) {
      this.logger.error(`Failed to load ErrorDialogComponent:  ${error}`);
      return null;
    }
  }

  // Method to show error dialog with proper error handling
  async showErrorDialog(message: string): Promise<void> {
    try {
      const component = await this.errorDialogComponentPromise;
      if (component) {
        this.dialog.open(component, {
          data: { message }
        });
      } else {
        // Fallback if component couldn't be loaded
        this.logger.error('Error:', message);
        alert(message); // Simple fallback
      }
    } catch (error) {
      this.logger.error(`Failed to show error dialog: ${error}`);
      alert(message); // Simple fallback
    }
  }

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
        if (!this.reportForm.controls['testName'].value) {
          this.showErrorDialog('Test name is required');
          throw new Error('Test name is required');
        }

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

          this.projectDataSourceService
            .connect()
            .pipe(
              take(1),
              tap((data) => {
                this.projectDataSourceService.setData([...data, reportDetails]);
                this.uploadSpecService.completeUpload();
              }),
              catchError((error) => {
                this.logger.error('Error updating project data source:', error);
                return throwError(() => error);
              })
            )
            .subscribe();

          return {
            projectSlug,
            eventId,
            eventName,
            specContent,
            recordingContent,
            reportDetails
          };
        } else {
          this.showErrorDialog('Spec content is required and cannot be empty.');
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
          return this.reportService
            .addReport(
              projectSlug,
              eventId,
              reportDetails,
              JSON.parse(recordingContent),
              JSON.parse(specContent)
            )
            .pipe(
              catchError((error) => {
                this.logger.error('Error adding report:', error);
                this.showErrorDialog('Failed to add report. Please try again.');
                return throwError(() => error);
              })
            );
        }
      )
    );
  }

  completeUpload() {
    this.uploadSpecService.completeUpload();
  }
}
