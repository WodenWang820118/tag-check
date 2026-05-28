import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import {
  IReportDetails,
  TestEventSchema,
  Recording,
  Spec,
  TestEvent,
  AbstractTestEvent,
  StrictDataLayerEvent
} from '@utils';
import { environment } from '../../../../../environments/environment';
import { catchHttpError, rethrowHttpError } from '../http-error.utils';
import { API_OPERATION_CONTEXT } from '../api-request-id.interceptor';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  constructor(private readonly http: HttpClient) {}
  /**
   * Fetches all abstract test events (reports) for a project.
   *
   * @param projectSlug - URL-friendly project identifier.
   */
  getProjectReports(projectSlug: string) {
    return this.http
      .get<AbstractTestEvent[]>(`${environment.reportApiUrl}/${projectSlug}`, {
        context: new HttpContext().set(API_OPERATION_CONTEXT, 'reports.list')
      })
      .pipe(rethrowHttpError('Failed to get reports'));
  }

  /**
   * Bulk-updates test events for a project.
   *
   * @param projectSlug - URL-friendly project identifier.
   * @param reports     - Array of report details to persist.
   */
  updateTestEvents(projectSlug: string, reports: IReportDetails[]) {
    return this.http
      .put<TestEvent[]>(`${environment.reportApiUrl}/${projectSlug}`, reports)
      .pipe(rethrowHttpError('Failed to update test event'));
  }

  /**
   * Updates a single abstract report.
   *
   * @param projectSlug - URL-friendly project identifier.
   * @param report      - Updated report payload.
   */
  updateReport(projectSlug: string, report: AbstractTestEvent) {
    return this.http
      .put<AbstractTestEvent>(
        `${environment.reportApiUrl}/${projectSlug}`,
        report
      )
      .pipe(rethrowHttpError('Failed to update report'));
  }

  /**
   * Creates a new test report for a single event.
   *
   * @param projectSlug   - URL-friendly project identifier.
   * @param eventId       - Test event identifier.
   * @param reportDetails - Report metadata payload.
   * @param recording     - Associated recording.
   * @param spec          - Strict data-layer event spec used for validation.
   */
  addReport(
    projectSlug: string,
    eventId: string,
    reportDetails: IReportDetails,
    recording: Recording,
    spec: StrictDataLayerEvent
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
      .pipe(rethrowHttpError('Failed to add report'));
  }

  /**
   * Creates a full test report combining recording, spec, and data-layer spec.
   *
   * @param projectSlug   - URL-friendly project identifier.
   * @param eventId       - Test event identifier.
   * @param reportDetails - Report metadata payload.
   * @param recording     - Associated recording.
   * @param spec          - High-level spec.
   * @param dataLayerSpec - Strict data-layer event spec.
   */
  addFullReport(
    projectSlug: string,
    eventId: string,
    reportDetails: IReportDetails,
    recording: Recording,
    spec: Spec,
    dataLayerSpec: StrictDataLayerEvent
  ) {
    return this.http
      .post<TestEvent>(
        `${environment.reportApiUrl}/${projectSlug}/${eventId}`,
        {
          reportDetails,
          recording,
          spec,
          dataLayerSpec
        }
      )
      .pipe(rethrowHttpError('Failed to add full report'));
  }

  /**
   * Downloads the XLSX report for a single event and triggers a browser
   * file-save dialog. Failures are swallowed since the operation is
   * fire-and-forget with no observable consumer.
   *
   * @param projectSlug - URL-friendly project identifier.
   * @param eventName   - Name of the event whose report to download.
   */
  downloadFile(projectSlug: string, eventName: string) {
    this.http
      .get(`${environment.reportApiUrl}/xlsx/${projectSlug}/${eventName}`, {
        responseType: 'blob'
      })
      .pipe(catchHttpError(null))
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

  /**
   * Deletes individual reports one at a time and waits for all deletions.
   *
   * Per-item failures return `null` so a single failing delete does not
   * abort the remaining ones.
   *
   * @param projectSlug - URL-friendly project identifier.
   * @param reports     - Array of report details whose events to delete.
   */
  deleteReports(projectSlug: string, reports: IReportDetails[]) {
    const tasks = reports.map((report) =>
      this.http
        .delete<TestEventSchema>(
          `${environment.reportApiUrl}/${projectSlug}/${report.eventId}`
        )
        .pipe(catchHttpError(null))
    );
    return forkJoin(tasks); // Waits for all DELETE operations to complete.
  }

  /**
   * Deletes multiple reports in a single batched request.
   *
   * Returns `null` on HTTP failure rather than throwing so callers can treat
   * the result as an optional confirmation.
   *
   * @param projectSlug - URL-friendly project identifier.
   * @param eventIds    - Array of event IDs to delete.
   */
  deleteBatchReports(projectSlug: string, eventIds: string[]) {
    if (!projectSlug || !eventIds) throw new Error('Invalid arguments');
    console.log('Deleting reports:', eventIds);
    return this.http
      .delete<TestEventSchema>(`${environment.reportApiUrl}/${projectSlug}`, {
        body: eventIds
      })
      .pipe(catchHttpError(null));
  }

  /**
   * Fetches the detailed report for a single test event.
   *
   * Failures are rethrown with a friendly message plus sanitized diagnostic
   * metadata so Sentry can correlate the frontend error with backend logs.
   *
   * @param projectSlug - URL-friendly project identifier.
   * @param eventId     - Test event identifier.
   */
  getReportDetails(
    projectSlug: string,
    eventId: string
  ): Observable<IReportDetails> {
    return this.http
      .get<IReportDetails>(
        `${environment.reportApiUrl}/${projectSlug}/${eventId}`,
        {
          context: new HttpContext().set(
            API_OPERATION_CONTEXT,
            'reports.detail'
          )
        }
      )
      .pipe(rethrowHttpError('Failed to get report details'));
  }
}
