import { computed, effect, Injectable, signal } from '@angular/core';
import {
  IReportDetails,
  ReportDetailsDto,
  GTMConfiguration,
  StrictDataLayerEvent,
  TestEvent,
  AbstractTestEvent
} from '@utils';
import { UploadSpecService } from '../../../../shared/services/upload-spec/upload-spec.service';
import {
  forkJoin,
  timer,
  catchError,
  of,
  tap,
  Observable,
  concatMap,
  take,
  switchMap,
  from,
  finalize
} from 'rxjs';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { v4 as uuidv4 } from 'uuid';
import { GtmJsonParserService } from '../../../../shared/services/api/gtm-json-parser/gtm-json-parser.service';
import { ReportTableDataSourceModelService } from '../../services/report-table-data-source-model/report-table-data-source-model.service';
import { ReportMapperService } from '../../services/report-mapper/report-mapper.service';

@Injectable({
  providedIn: 'root'
})
export class UploadCardFacadeService {
  importedSpec = signal<string>('');
  importedSpec$ = computed(() => this.importedSpec());

  gtmConfiguration = signal<GTMConfiguration | null>(null);
  gtmConfiguration$ = computed(() => this.gtmConfiguration());

  projectSlug = signal<string>('');
  projectSlug$ = computed(() => this.projectSlug());

  constructor(
    private readonly uploadSpecService: UploadSpecService,
    private readonly reportService: ReportService,
    private readonly gtmJsonParserService: GtmJsonParserService,
    private readonly reportTableDataSourceModelService: ReportTableDataSourceModelService,
    private readonly reportMapper: ReportMapperService
  ) {
    effect(() => {
      const gtmConfig = this.gtmConfiguration$();
      const projectSlug = this.projectSlug$();
      console.log('project slug: ', projectSlug);
      console.log('gtm config: ', gtmConfig);
      if (gtmConfig && projectSlug) {
        this.gtmJsonParserService
          .uploadGtmJson(projectSlug, gtmConfig)
          .pipe(
            switchMap(() => this.reportService.getProjectReports(projectSlug)),
            tap((reports: AbstractTestEvent[]) => {
              const mapped = this.reportMapper.toReportDetails(reports);
              const sorted = [...mapped].sort((a, b) =>
                a.eventName.localeCompare(b.eventName)
              );
              const ds = this.reportTableDataSourceModelService.dataSource();
              ds.data = [...sorted];
            }),
            take(1)
          )
          .subscribe();
      }
    });
  }

  // Mapping moved to ReportMapperService

  onFileSelected(projectSlug: string, event: Event) {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      console.warn('No file selected');
      return;
    }

    from(file.text())
      .pipe(
        tap((result) => {
          try {
            this.projectSlug.set(projectSlug);
            const parsedSpec = this.gtmJsonParserService.parseGtmJson(
              String(result ?? '')
            );
            this.gtmConfiguration.set(parsedSpec);
          } catch (error) {
            console.error('Error parsing file:', error);
            // keep behavior similar to prior implementation
            alert('Error parsing file');
          }
        }),
        catchError((err) => {
          console.error('Failed to read file', err);
          alert('Failed to read file');
          return of(null);
        }),
        finalize(() => {
          try {
            if (input) input.value = '';
          } catch {
            // ignore
          }
        })
      )
      .subscribe();
  }

  emitUploadComplete() {
    this.uploadSpecService.completeUpload();
  }

  isUploaded() {
    return this.uploadSpecService.isUploaded();
  }

  completeUpload() {
    this.uploadSpecService.completeUpload();
  }

  save(projectSlug: string): Observable<unknown> {
    try {
      const specs = JSON.parse(this.importedSpec()) as StrictDataLayerEvent[];

      // 1. Use .reduce() to create a dictionary of observables
      const requestsAsObject = specs.reduce(
        (acc, spec) => {
          const eventId = uuidv4(); // This will be the key in our dictionary
          const reportDetails: IReportDetails = new ReportDetailsDto({
            eventId: eventId,
            testName: `GA4 event - ${spec.event}`,
            eventName: spec.event
          });

          const reportObservable = this.reportService
            .addReport(
              projectSlug,
              `${eventId}`,
              reportDetails,
              JSON.parse('{}'),
              spec
            )
            .pipe(
              // Handle errors for individual requests, so one failure doesn't stop all
              catchError((error) => {
                console.error(
                  `Failed to save spec for event "${spec.event}":`,
                  error
                );
                return of(null); // Allow forkJoin to complete by returning a null result
              })
            );

          // Add the observable to the accumulator object using eventId as the key
          acc[eventId] = reportObservable;
          return acc;
        },
        {} as { [key: string]: Observable<TestEvent | null> }
      ); // Start with an empty object

      // Check if there are any requests to process
      if (Object.keys(requestsAsObject).length === 0) {
        this.emitUploadComplete();
        return of([]); // Nothing to do, complete immediately
      }

      // 2. Pass the dictionary to forkJoin
      return forkJoin(requestsAsObject).pipe(
        // 3. Use concatMap for cleaner, chained asynchronous operations
        concatMap((results) => {
          // `results` is now an object, e.g., { "uuid1": result1, "uuid2": null }
          console.log('All specs processed:', results);
          this.emitUploadComplete();
          // Chain the timer, then reload
          return timer(1500).pipe(tap(() => globalThis.location.reload()));
        }),
        // This outer catchError is for catastrophic failures, not individual ones
        catchError((error) => {
          console.error(
            'An unexpected error occurred in the forkJoin stream:',
            error
          );
          this.emitUploadComplete();
          return of(error);
        })
      );
    } catch (error) {
      console.error('Failed to parse specs:', error);
      this.emitUploadComplete();
      return of(error);
    }
  }
}
