import { AsyncPipe, JsonPipe, NgIf } from '@angular/common';
import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  Observable,
  Subject,
  catchError,
  combineLatest,
  map,
  of,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import {
  extractEventNameFromId,
  IReportDetails,
  Recording,
  Spec,
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
@Component({
  selector: 'app-report-datail-panels',
  standalone: true,
  imports: [
    AsyncPipe,
    NgIf,
    JsonPipe,
    MatIconModule,
    MatExpansionModule,
    MatTooltipModule,
    EditorComponent,
    MatButtonModule,
    ErrorDialogComponent,
  ],
  templateUrl: './report-detail-panels.component.html',
  styleUrls: ['./report-detail-panels.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ReportDetailPanelsComponent implements OnInit, OnDestroy {
  @Input() eventName!: string | undefined;
  @Input() reportDetails$!: Observable<IReportDetails | undefined>;
  recording$!: Observable<Recording | null>;
  spec$!: Observable<Spec | null>;
  destroy$ = new Subject<void>();
  specEdit = false;
  recordingEdit = false;
  specEditMode = false;
  recordingEditMode = false;

  constructor(
    private recordingService: RecordingService,
    private specService: SpecService,
    public reportService: ReportService,
    private route: ActivatedRoute,
    public editorService: EditorService,
    private dialog: MatDialog,
    private utilsService: UtilsService
  ) {}

  ngOnInit() {
    this.initializeDataStreams();
  }

  private initializeDataStreams() {
    const projectSlug$ =
      this.route.parent?.params.pipe(map((params) => params['projectSlug'])) ||
      of('');
    const eventId$ = this.route.params.pipe(map((params) => params['eventId']));

    // Combine projectSlug and eventName streams for use in spec$ and recording$ initializations
    combineLatest([projectSlug$, eventId$])
      .pipe(
        takeUntil(this.destroy$),
        tap(([projectSlug, eventId]) => {
          if (projectSlug && eventId) {
            // extract the eventName from the route params with regex
            const eventName = extractEventNameFromId(eventId);
            this.spec$ = this.specService.getSpec(projectSlug, eventName);
            this.recording$ = this.recordingService.getRecordingDetails(
              projectSlug,
              eventId
            );
          }
        }),
        catchError((error) => {
          console.error('Error: ', error);
          return error;
        })
      )
      .subscribe();
  }

  switchSpecEditMode(event: Event) {
    event.stopPropagation();

    this.specEditMode = !this.specEditMode;
  }

  switchRecordingEditMode(event: Event) {
    event.stopPropagation();

    this.recordingEditMode = !this.recordingEditMode;
  }

  switchSpecEdit() {
    this.specEdit = !this.specEdit;
  }

  switchRecordingEdit() {
    this.recordingEdit = !this.recordingEdit;
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

  onSpecUpdate() {
    combineLatest([
      this.route.parent?.params || of({ projectSlug: '' }),
      this.route.params,
      this.editorService.editor$.specJsonEditor,
    ])
      .pipe(
        take(1),
        switchMap(([parentParams, params, specEditor]) => {
          const projectSlug = parentParams['projectSlug'];
          const eventName = params['eventName'];
          const specContent = specEditor.state.doc.toString();

          if (
            projectSlug &&
            eventName &&
            !this.utilsService.isEmptyObject(JSON.parse(specContent))
          ) {
            return this.specService.updateSpec(
              projectSlug,
              eventName,
              specContent
            );
          } else {
            return this.showErrorDialog(
              'Spec content is required and cannot be empty.'
            );
          }
        }),
        catchError(() => {
          return this.showErrorDialog(
            'Spec content is required and cannot be empty.'
          );
        })
      )
      .subscribe();
  }

  onRecordingUpdate() {
    combineLatest([
      this.route.parent?.params || of({ projectSlug: '' }),
      this.route.params,
      this.editorService.editor$.recordingJsonEditor,
    ])
      .pipe(
        take(1),
        switchMap(([parentParams, params, recordingEditor]) => {
          const projectSlug = parentParams['projectSlug'];
          const eventId = params['eventId'];
          const recordingContent = recordingEditor.state.doc.toString();

          if (
            parentParams &&
            projectSlug &&
            !this.utilsService.isEmptyObject(JSON.parse(recordingContent))
          ) {
            return this.recordingService.updateRecording(
              projectSlug,
              eventId,
              recordingContent
            );
          } else {
            return this.showErrorDialog(
              'Recording content is required and cannot be empty.'
            );
          }
        }),
        catchError(() =>
          this.showErrorDialog(
            'Recording content is required and cannot be empty.'
          )
        )
      )
      .subscribe();
  }

  onDownload() {
    combineLatest([
      this.route.parent?.params || of({ projectSlug: '' }),
      this.route.params,
    ])
      .pipe(
        take(1),
        tap(([parentParams, params]) => {
          const projectSlug = parentParams['projectSlug'];
          const eventName = params['eventName'];

          if (projectSlug && eventName) {
            return this.reportService.downloadFile(projectSlug, eventName);
          } else {
            this.dialog.open(ErrorDialogComponent, {
              data: {
                message: 'Project slug and event name are required.',
              },
            });
            throw new Error('Project slug and event name are required.');
          }
        }),
        catchError((error) => {
          console.error('Error downloading file: ', error);
          return error;
        })
      )
      .subscribe();
  }

  private showErrorDialog(message: string): Observable<null> {
    this.dialog.open(ErrorDialogComponent, {
      data: {
        message: message,
      },
    });
    return of(null);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
