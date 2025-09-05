import { DestroyRef, Injectable, inject } from '@angular/core';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import {
  IReportDetails,
  ReportDetailsDto,
  Recording,
  StrictDataLayerEvent
} from '@utils';
import { tap, take, switchMap, throwError, catchError, EMPTY } from 'rxjs';
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
    event: 'add_payment_info',
    ecommerce: {
      currency: 'USD',
      value: 30.03,
      coupon: 'SUMMER_FUN',
      payment_type: 'Credit Card',
      items: [
        {
          item_id: 'SKU_12345',
          item_name: 'Stan and Friends Tee',
          affiliation: 'Google Merchandise Store',
          coupon: 'SUMMER_FUN',
          discount: 2.22,
          index: 0,
          item_brand: 'Google',
          item_category: 'Apparel',
          item_category2: 'Adult',
          item_category3: 'Shirts',
          item_category4: 'Crew',
          item_category5: 'Short sleeve',
          item_list_id: 'related_products',
          item_list_name: 'Related Products',
          item_variant: 'green',
          location_id: 'ChIJIQBpAG2ahYAR_6128GcTUEo',
          price: 10.01,
          quantity: 3
        }
      ]
    }
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
    const specContent = this.editorService.contentSubjects.specJson();
    const recordingContent = this.editorService.contentSubjects.recordingJson();
    this.editorService.setContent('specJson', specContent);
    this.editorService.setContent('recordingJson', recordingContent);
  }

  uploadReport(projectSlug: string) {
    const specEditor = this.editorService.editor$.specJsonEditor();
    const recordingEditor = this.editorService.editor$.recordingJsonEditor();
    const specContent = specEditor.state.doc.toString();
    const recordingContent = recordingEditor.state.doc.toString();
    const testName = specContent ? JSON.parse(specContent).event : '';
    // cleaned legacy combineLatest-based editor content sync
    const eventId = uuidv4();

    if (specContent && projectSlug) {
      // Validate JSON inputs and extract fields
      let specParsed: StrictDataLayerEvent = {} as StrictDataLayerEvent;
      let recordingParsed: Recording = {} as Recording;
      try {
        specParsed = JSON.parse(specContent) as StrictDataLayerEvent;
      } catch {
        this.showErrorDialog('Spec must be valid JSON.');
        return EMPTY;
      }
      if (recordingContent && recordingContent.trim() !== '') {
        try {
          recordingParsed = JSON.parse(recordingContent) as Recording;
        } catch {
          this.showErrorDialog('Recording must be valid JSON.');
          return EMPTY;
        }
      }

      const eventName = (specParsed as { event?: string }).event ?? 'unknown';
      const reportDetails: IReportDetails = new ReportDetailsDto({
        eventId: eventId,
        testName: testName,
        eventName: eventName
      });

      return this.projectDataSourceService.connect().pipe(
        take(1),
        tap((data) => {
          this.projectDataSourceService.setData([...data, reportDetails]);
          this.uploadSpecService.completeUpload();
        }),
        switchMap(() =>
          this.reportService
            .addReport(
              projectSlug,
              eventId,
              reportDetails,
              recordingParsed,
              specParsed
            )
            .pipe(
              catchError((error) => {
                this.logger.error('Error adding report:', error);
                this.showErrorDialog('Failed to add report. Please try again.');
                return throwError(() => error);
              })
            )
        )
      );
    }

    this.showErrorDialog('Spec content is required and cannot be empty.');
    return EMPTY;
    // cleaned legacy combineLatest-based addReport flow
  }

  completeUpload() {
    this.uploadSpecService.completeUpload();
  }
}
