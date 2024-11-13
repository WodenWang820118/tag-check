import { AsyncPipe, JsonPipe } from '@angular/common';
import { Component, computed, effect, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { catchError, firstValueFrom, map, of, take, tap } from 'rxjs';
import {
  extractEventNameFromId,
  IReportDetails,
  Recording,
  Spec
} from '@utils';
import { MatExpansionModule } from '@angular/material/expansion';
import { RecordingService } from '../../../../shared/services/api/recording/recording.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { SpecService } from '../../../../shared/services/api/spec/spec.service';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { EditorComponent } from '../../../../shared/components/editor/editor.component';
import { MatButtonModule } from '@angular/material/button';
import { EditorService } from '../../../../shared/services/editor/editor.service';
import { ErrorDialogComponent } from '../../../../shared/components/error-dialog/error-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { UtilsService } from '../../../../shared/services/utils/utils.service';
import { toSignal } from '@angular/core/rxjs-interop';
@Component({
  selector: 'app-report-datail-panels',
  standalone: true,
  imports: [
    AsyncPipe,
    JsonPipe,
    MatIconModule,
    MatExpansionModule,
    MatTooltipModule,
    EditorComponent,
    MatButtonModule
  ],
  templateUrl: './report-detail-panels.component.html',
  styleUrls: ['./report-detail-panels.component.scss']
})
export class ReportDetailPanelsComponent {
  // Input signals
  reportDetails = input<IReportDetails | undefined>(undefined);

  // State signals
  recording = signal<Recording | null>(null);
  spec = signal<Spec | null>(null);
  error = signal<string | null>(null);
  loading = signal(false);

  // Edit mode signals
  specEdit = signal(false);
  recordingEdit = signal(false);
  specEditMode = signal(false);
  recordingEditMode = signal(false);

  // Route parameters as signals
  private projectSlug = toSignal(
    this.route.parent?.params.pipe(map((params) => params['projectSlug'])) ||
      of('')
  );
  private routeEventId = toSignal(
    this.route.params.pipe(map((params) => params['eventId']))
  );

  // Computed values
  protected eventNameFromRoute = computed(() => {
    const eventId = this.routeEventId();
    return eventId ? extractEventNameFromId(eventId) : '';
  });

  constructor(
    private recordingService: RecordingService,
    private specService: SpecService,
    public reportService: ReportService,
    private route: ActivatedRoute,
    public editorService: EditorService,
    private dialog: MatDialog,
    private utilsService: UtilsService
  ) {
    // Initialize data streams using effect
    effect(
      () => {
        this.loadData();
      },
      {
        allowSignalWrites: true
      }
    );
  }

  private loadData() {
    const slug = this.projectSlug();
    const eventId = this.routeEventId();

    if (slug && eventId) {
      const eventName = this.eventNameFromRoute();

      // Load spec
      this.specService
        .getSpec(slug, eventName)
        .pipe(take(1))
        .subscribe((spec) => this.spec.set(spec));

      // Load recording
      this.recordingService
        .getRecordingDetails(slug, eventId)
        .pipe(take(1))
        .subscribe((recording) => this.recording.set(recording));
    }
  }

  switchSpecEditMode(event: Event) {
    event.stopPropagation();

    // this.specEditMode = !this.specEditMode;
    this.specEditMode.update((prev) => !prev);
  }

  switchRecordingEditMode(event: Event) {
    event.stopPropagation();

    // this.recordingEditMode = !this.recordingEditMode;
    this.recordingEditMode.update((prev) => !prev);
  }

  switchSpecEdit() {
    // this.specEdit = !this.specEdit;
    this.specEdit.update((prev) => !prev);
  }

  switchRecordingEdit() {
    // this.recordingEdit = !this.recordingEdit;
    this.recordingEdit.update((prev) => !prev);
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file: File | null = target.files?.[0] || null;
    if (file) {
      this.reportService.readJsonFileContent(file);

      this.reportService.fileContent$
        .pipe(
          take(1),
          tap((data) => {
            if (data) {
              this.editorService.setContent(
                'recordingJson',
                JSON.stringify(data)
              );
            }
          }),
          catchError((error) => {
            console.error('Error reading file content: ', error);
            return error;
          })
        )
        .subscribe();
    }
  }

  async onSpecUpdate() {
    const slug = this.projectSlug();
    const eventName = this.eventNameFromRoute();
    const editor = await firstValueFrom(
      this.editorService.editor$.specJsonEditor
    );

    const specContent = editor.state.doc.toString();

    try {
      const parsedContent = JSON.parse(specContent);

      if (
        slug &&
        eventName &&
        !this.utilsService.isEmptyObject(parsedContent)
      ) {
        await firstValueFrom(
          this.specService.updateSpec(slug, eventName, parsedContent)
        );
      } else {
        this.showErrorDialog('Spec content is required and cannot be empty.');
      }
    } catch (err) {
      this.showErrorDialog('Invalid spec content');
    }
  }

  async onRecordingUpdate() {
    const slug = this.projectSlug();
    const eventName = this.eventNameFromRoute();
    const editor = await firstValueFrom(
      this.editorService.editor$.recordingJsonEditor
    );

    const recordingContent = editor.state.doc.toString();

    try {
      const parsedContent = JSON.parse(recordingContent);

      if (
        slug &&
        eventName &&
        !this.utilsService.isEmptyObject(parsedContent)
      ) {
        await firstValueFrom(
          this.recordingService.updateRecording(slug, eventName, parsedContent)
        );
      } else {
        this.showErrorDialog(
          'Recording content is required and cannot be empty.'
        );
      }
    } catch (err) {
      this.showErrorDialog('Invalid recording content');
    }
  }

  onDownload() {
    const slug = this.projectSlug();
    const eventName = this.eventNameFromRoute();

    if (slug && eventName) {
      this.reportService.downloadFile(slug, eventName);
    } else {
      this.showErrorDialog('Project slug and event name are required.');
    }
  }

  private showErrorDialog(message: string) {
    this.dialog.open(ErrorDialogComponent, {
      data: {
        message: message
      }
    });
  }
}
