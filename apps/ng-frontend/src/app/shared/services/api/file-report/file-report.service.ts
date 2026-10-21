import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { DeleteRunsResponse, Jsonified, RunSummary } from '@utils';
import { catchHttpError, rethrowHttpError } from '../http-error.utils';

@Injectable({
  providedIn: 'root'
})
export class FileReportService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Lists every run of the project's tests, newest first.
   *
   * Returns `null` on HTTP failure so callers can treat a missing list as an
   * empty state.
   *
   * @param projectSlug - URL-friendly project identifier.
   */
  getFileReports(projectSlug: string) {
    return this.http
      .get<Jsonified<RunSummary>[]>(
        `${environment.fileReportApiUrl}/${projectSlug}`
      )
      .pipe(catchHttpError(null));
  }

  /**
   * Deletes runs and the screenshots they saved; the tests stay.
   *
   * @param projectSlug - URL-friendly project identifier.
   * @param runIds      - The runs to delete.
   */
  deleteRuns(projectSlug: string, runIds: number[]) {
    return this.http
      .delete<DeleteRunsResponse>(
        `${environment.fileReportApiUrl}/${projectSlug}`,
        { params: { runIds: runIds.join(',') } }
      )
      .pipe(rethrowHttpError('Error deleting runs'));
  }

  downloadFileReports(projectSlug: string, eventIds: string[]) {
    return this.http
      .post(
        `${environment.fileReportApiUrl}/download/${projectSlug}`,
        eventIds,
        {
          observe: 'response',
          responseType: 'blob',
          headers: new HttpHeaders({
            Accept:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          })
        }
      )
      .pipe(
        map((response: HttpResponse<Blob>) => {
          if (!response.body) {
            return null;
          }

          const blob = response.body;
          const filename =
            this.getFilenameFromResponse(response) || 'report.xlsx';
          // Use FileSaver.js or similar library
          this.saveFile(blob, filename);
          return response;
        }),
        catchHttpError(null)
      );
  }

  private getFilenameFromResponse(response: HttpResponse<Blob>): string | null {
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(
        contentDisposition
      );
      if (matches?.[1]) {
        return matches?.[1].replaceAll(/['"]/g, '');
      }
    }
    return null;
  }

  private saveFile(blob: Blob, fileName: string) {
    const link = document.createElement('a');
    link.href = globalThis.URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    globalThis.URL.revokeObjectURL(link.href);
  }
}
