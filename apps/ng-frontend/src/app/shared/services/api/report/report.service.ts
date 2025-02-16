import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, of, throwError } from 'rxjs';
import {
  ProjectReport,
  IReportDetails,
  TestEventSchema,
  Recording,
  Spec,
  TestEvent,
  AbstractTestEvent
} from '@utils';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  constructor(private http: HttpClient) {}
  getProjectReports(projectSlug: string) {
    return this.http
      .get<AbstractTestEvent[]>(`${environment.reportApiUrl}/${projectSlug}`)
      .pipe(
        catchError((error) => {
          console.error(error);
          return throwError(() => new Error('Failed to get reports'));
        })
      );
  }

  updateTestEvents(projectSlug: string, reports: IReportDetails[]) {
    return this.http
      .put<TestEvent[]>(`${environment.reportApiUrl}/${projectSlug}`, reports)
      .pipe(
        catchError((error) => {
          console.error(error);
          return throwError(() => new Error('Failed to update test event'));
        })
      );
  }

  updateReport(projectSlug: string, report: AbstractTestEvent) {
    return this.http
      .put<AbstractTestEvent>(
        `${environment.reportApiUrl}/${projectSlug}`,
        report
      )
      .pipe(
        catchError((error) => {
          console.error(error);
          return throwError(() => new Error('Failed to update report'));
        })
      );
  }

  addReport(
    projectSlug: string,
    eventId: string,
    reportDetails: IReportDetails,
    recording: Recording,
    spec: Spec
  ) {
    return this.http
      .post<TestEvent>(
        `${environment.reportApiUrl}/${projectSlug}/${eventId}`,
        {
          reportDetails,
          recording,
          spec
        }
      )
      .pipe(
        catchError((error) => {
          console.error(error);
          return throwError(() => new Error('Failed to add report'));
        })
      );
  }

  downloadFile(projectSlug: string, eventName: string) {
    this.http
      .get(`${environment.reportApiUrl}/xlsx/${projectSlug}/${eventName}`, {
        responseType: 'blob'
      })
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      )
      .subscribe((blob) => {
        if (blob) {
          // Create a new Blob object using the response data of the file
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `${projectSlug}_${eventName}.xlsx`; // A default filename if none is specified by headers
          a.click();

          URL.revokeObjectURL(a.href);
        }
      });
  }

  deleteReports(projectSlug: string, reports: IReportDetails[]) {
    const tasks = reports.map((report) =>
      this.http
        .delete<TestEventSchema>(
          `${environment.reportApiUrl}/${projectSlug}/${report.eventId}`
        )
        .pipe(
          catchError((error) => {
            console.error(error);
            return of(null);
          })
        )
    );
    return forkJoin(tasks); // Waits for all DELETE operations to complete.
  }

  deleteBatchReports(projectSlug: string, eventIds: string[]) {
    if (!projectSlug || !eventIds) throw new Error('Invalid arguments');
    console.log('Deleting reports:', eventIds);
    return this.http
      .delete<TestEventSchema>(`${environment.reportApiUrl}/${projectSlug}`, {
        body: eventIds
      })
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }

  getReportDetails(
    projectSlug: string,
    eventId: string
  ): Observable<IReportDetails> {
    return this.http
      .get<IReportDetails>(
        `${environment.reportApiUrl}/${projectSlug}/${eventId}`
      )
      .pipe(
        catchError((error) => {
          console.error(error);
          throw error;
        })
      );
  }
}
