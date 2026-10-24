import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  IReportDetails,
  TestEventSchema,
  Recording,
  Spec,
  TestEvent,
  AbstractTestEvent,
  ReportDetailResponse,
  StrictDataLayerEvent
} from '@utils';
import { environment } from '../../../../../environments/environment';
import { catchHttpError, rethrowHttpError } from '../http-error.utils';
import { API_OPERATION_CONTEXT } from '../api-request-id.interceptor';

/**
 * The tests API (test events): list, create, update and delete tests, and
 * load a test's latest result.
 */
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
  ): Observable<ReportDetailResponse> {
    return this.http
      .get<ReportDetailResponse>(
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
