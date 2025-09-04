import { computed, effect, Injectable, signal } from '@angular/core';
import {
  Spec,
  IReportDetails,
  ReportDetailsDto,
  GTMConfiguration
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
  take
} from 'rxjs';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { v4 as uuidv4 } from 'uuid';
import { GtmJsonParserService } from '../../../../shared/services/api/gtm-json-parser/gtm-json-parser.service';

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
    private readonly gtmJsonParserService: GtmJsonParserService
  ) {
    effect(() => {
      const gtmConfig = this.gtmConfiguration$();
      const projectSlug = this.projectSlug$();
      console.log('project slug: ', projectSlug);
      if (gtmConfig && projectSlug) {
        this.gtmJsonParserService
          .uploadGtmJson(projectSlug, JSON.stringify(gtmConfig))
          .pipe(take(1))
          .subscribe();
      }
    });
  }

  onFileSelected(projectSlug: string, event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = reader.result as string;
        this.projectSlug.set(projectSlug);
        const parsedSpec = this.gtmJsonParserService.parseGtmJson(result);

        this.gtmConfiguration.set(parsedSpec);
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('Error parsing file');
      }
    };
    reader.readAsText(file);
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

  // TODO: batch upload instead of one by one
  // TODO: GTM JSON compatible
  save(projectSlug: string): Observable<any> {
    try {
      const specs = JSON.parse(this.importedSpec()) as Spec[];

      // 1. Use .reduce() to create a dictionary of observables
      const requestsAsObject = specs.reduce(
        (acc, spec) => {
          const eventId = uuidv4(); // This will be the key in our dictionary
          const reportDetails: IReportDetails = new ReportDetailsDto({
            eventId: eventId,
            testName: spec.tag.name,
            eventName: 'Standard'
          });

          const reportObservable = this.reportService
            .addReport(
              projectSlug,
              `${spec.tag.name}_${eventId}`,
              reportDetails,
              JSON.parse('{}'),
              spec
            )
            .pipe(
              // Handle errors for individual requests, so one failure doesn't stop all
              catchError((error) => {
                console.error(
                  `Failed to save spec for event "${spec.tag.name}":`,
                  error
                );
                return of(null); // Allow forkJoin to complete by returning a null result
              })
            );

          // Add the observable to the accumulator object using eventId as the key
          acc[eventId] = reportObservable;
          return acc;
        },
        {} as { [key: string]: Observable<any> }
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
          return timer(1500).pipe(tap(() => window.location.reload()));
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
