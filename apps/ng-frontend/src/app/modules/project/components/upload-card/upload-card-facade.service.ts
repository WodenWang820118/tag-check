import { Injectable, signal } from '@angular/core';
import { Spec, IReportDetails, ReportDetailsDto } from '@utils';
import { UploadSpecService } from '../../../../shared/services/upload-spec/upload-spec.service';
import { take, forkJoin, timer, catchError, of, tap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class UploadCardFacadeService {
  importedSpec = signal<string>('');

  constructor(
    private readonly uploadSpecService: UploadSpecService,
    private readonly route: ActivatedRoute,
    private readonly reportService: ReportService
  ) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = reader.result as string;
        const parsedSpec = JSON.parse(result) as Spec[];

        if (this.uploadSpecService.existKeys(parsedSpec)) {
          this.importedSpec.set(result);
        } else {
          alert('Invalid spec');
        }
      } catch (error) {
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
  save(projectSlug: string) {
    try {
      const specs = JSON.parse(this.importedSpec()) as Spec[];

      // Create array of observables
      const requests = specs.map((spec) => {
        const eventId = uuidv4();
        const reportDetails: IReportDetails = new ReportDetailsDto({
          eventId: eventId,
          testName: spec.event,
          eventName: 'Standard'
        });

        // Return the observable without subscribing
        return this.reportService
          .addReport(
            projectSlug,
            `${spec.event}_${eventId}`,
            reportDetails,
            JSON.parse('{}'),
            spec
          )
          .pipe(
            // Handle errors for individual requests
            catchError((error) => {
              console.error('Failed to save spec:', error);
              return of(null); // Return null for failed requests
            })
          );
      });

      // Combine all requests with forkJoin
      return forkJoin(requests).pipe(
        // Handle successful completion of all requests
        tap(() => {
          this.emitUploadComplete();
          timer(1500)
            .pipe(take(1))
            .subscribe(() => {
              window.location.reload();
            });
        }),
        // Handle errors for the combined observable
        catchError((error) => {
          console.error('Failed to save specs:', error);
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
