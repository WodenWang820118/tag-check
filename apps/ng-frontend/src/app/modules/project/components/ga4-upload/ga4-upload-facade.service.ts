import { Injectable, computed, signal } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import {
  ReportDetailsDto,
  StrictDataLayerEvent,
  Spec,
  Recording
} from '@utils';
import {
  catchError,
  forkJoin,
  of,
  map,
  switchMap,
  tap,
  from,
  finalize,
  ObservableInput
} from 'rxjs';
import { ReportTableDataSourceModelService } from '../../services/report-table-data-source-model/report-table-data-source-model.service';
import { ReportMapperService } from '../../services/report-mapper/report-mapper.service';

@Injectable({ providedIn: 'root' })
export class Ga4UploadFacadeService {
  rawJson = signal<string>('');
  events = signal<StrictDataLayerEvent[]>([]);
  parseError = signal<string | null>(null);
  isParsing = signal(false);
  isSaving = signal(false);

  events$ = computed(() => this.events());
  parseError$ = computed(() => this.parseError());
  isParsing$ = computed(() => this.isParsing());
  isSaving$ = computed(() => this.isSaving());

  constructor(
    private readonly reportService: ReportService,
    private readonly reportTableDataSourceModelService: ReportTableDataSourceModelService,
    private readonly reportMapper: ReportMapperService
  ) {}

  setRawJson(content: string) {
    this.rawJson.set(content ?? '');
    this.tryParse();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    this.isParsing.set(true);
    this.parseError.set(null);

    // Use File.text() which returns a Promise<string> and wrap it with RxJS
    // so we keep the method reactive and avoid async/await.
    // File.text() uses the browser's decoder (UTF-8 by default).
    from(file.text())
      .pipe(
        tap((text) => {
          const txt = String(text ?? '');
          this.rawJson.set(txt);
          this.tryParse();
        }),
        catchError((err) => {
          console.error('Failed to read file', err);
          this.parseError.set('Failed to read file.');
          this.events.set([]);
          return of(null);
        }),
        finalize(() => {
          this.isParsing.set(false);
          // reset the input so selecting the same file fires change again
          try {
            input.value = '';
          } catch {
            // ignore if input not writable in some environments
          }
        })
      )
      .subscribe();
  }

  private tryParse() {
    this.parseError.set(null);
    try {
      const json = JSON.parse(this.rawJson());
      const normalized = this.normalizeToEvents(json);
      // light validation: ensure each has an event name string
      const valid = normalized.filter(
        (e) => typeof e?.event === 'string' && String(e.event).length > 0
      );
      if (valid.length === 0) {
        this.events.set([]);
        this.parseError.set(
          'No valid GA4 events found. Ensure each object has an "event" string.'
        );
      } else {
        this.events.set(valid);
      }
    } catch {
      this.events.set([]);
      this.parseError.set(
        'Invalid JSON. Please provide a valid GA4 event or an array of events.'
      );
    }
  }

  private normalizeToEvents(input: unknown): StrictDataLayerEvent[] {
    if (!input) return [];
    if (Array.isArray(input)) return input as StrictDataLayerEvent[];
    if (typeof input === 'object') return [input as StrictDataLayerEvent];
    return [];
  }

  save(projectSlug: string) {
    const events = this.events();
    if (!projectSlug || events.length === 0) return of(false);
    this.isSaving.set(true);
    const tasks = events.map((evt) => {
      const eventId = uuidv4();
      const eventName = String(evt.event);
      const reportDetails = new ReportDetailsDto({
        eventId,
        testName: `GA4 event - ${eventName}`,
        eventName,
        destinationUrl: '',
        createdAt: new Date()
      });

      // minimal placeholder Spec so backend can persist rawGtmTag
      const spec: Spec = {
        tag: {
          name: `GA4 event - ${eventName}`,
          type: 'gaawe',
          accountId: '',
          containerId: '',
          parameter: []
        },
        trigger: []
      };

      const recording: Recording = { title: eventName, steps: [] };

      return this.reportService
        .addFullReport(
          projectSlug,
          eventId,
          reportDetails,
          recording,
          spec,
          evt
        )
        .pipe(
          catchError((e) => {
            console.error('Failed to save GA4 event', e);
            return of(false);
          })
        );
    });

    return forkJoin(tasks as readonly ObservableInput<unknown>[]).pipe(
      // After saving all events, fetch latest reports and update table
      switchMap(() => this.reportService.getProjectReports(projectSlug)),
      tap((reports) => {
        const mapped = this.reportMapper.toReportDetails(reports);
        const sorted = [...mapped].sort((a, b) =>
          a.eventName.localeCompare(b.eventName)
        );
        const ds = this.reportTableDataSourceModelService.dataSource();
        ds.data = [...sorted];
      }),
      map(() => {
        this.isSaving.set(false);
        return true;
      }),
      catchError((e) => {
        console.error('Failed to refresh reports after GA4 save', e);
        this.isSaving.set(false);
        return of(false);
      })
    );
  }
}
