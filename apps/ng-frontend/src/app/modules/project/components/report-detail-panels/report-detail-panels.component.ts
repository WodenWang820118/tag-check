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
  mergeMap,
  of,
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
import { Dialog } from '@angular/cdk/dialog';
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
    private editorService: EditorService,
    private dialog: Dialog
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
        map(([parentParams, params, specEditor]) => {
          const specContent = specEditor.state.doc.toString();
          const eventName = params['eventName'];
          const projectSlug = parentParams['projectSlug'];

          if (specContent && projectSlug) {
            return {
              projectSlug,
              eventName,
              specContent,
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
        mergeMap(({ projectSlug, eventName, specContent }) => {
          this.editorService.setContent('specJson', specContent);
          return this.specService.updateSpec(
            projectSlug,
            eventName,
            specContent
          );
        }),
        catchError((error) => {
          console.error('Error updating spec: ', error);
          return error;
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
        map(([parentParams, params, recordingEditor]) => {
          const projectSlug = parentParams['projectSlug'];
          const eventId = params['eventId'];
          const recordingContent = recordingEditor.state.doc.toString();

          if (parentParams && projectSlug) {
            return {
              projectSlug,
              eventId,
              recordingContent,
            };
          } else {
            this.dialog.open(ErrorDialogComponent, {
              data: {
                message: 'Recording content is required and cannot be empty.',
              },
            });
            throw new Error(
              'Recording content is required and cannot be empty.'
            );
          }
        }),
        mergeMap(({ projectSlug, eventId, recordingContent }) => {
          this.editorService.setContent('recordingJson', recordingContent);
          return this.recordingService.updateRecording(
            projectSlug,
            eventId,
            recordingContent
          );
        }),
        catchError((error) => {
          console.error('Error updating recording: ', error);
          return error;
        })
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
