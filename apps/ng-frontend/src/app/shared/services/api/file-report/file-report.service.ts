import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { FrontFileReport } from '@utils';

@Injectable({
  providedIn: 'root'
})
export class FileReportService {
  constructor(private http: HttpClient) {}

  getFileReports(projectSlug: string) {
    return this.http
      .get<FrontFileReport[]>(`${environment.fileReportApiUrl}/${projectSlug}`)
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }

  deleteFileReport(projectSlug: string, eventIds: string[]) {
    return this.http
      .delete<FrontFileReport>(
        `${environment.fileReportApiUrl}/${projectSlug}`,
        {
          params: { eventIds: eventIds }
        }
      )
      .pipe(
        catchError((error) => {
          console.error(error);
          return throwError(() => new Error('Error deleting file report'));
        })
      );
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
        catchError((error) => {
          console.error('Error downloading file:', error);
          return of(null);
        })
      );
  }

  private getFilenameFromResponse(response: HttpResponse<Blob>): string | null {
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(
        contentDisposition
      );
      if (matches != null && matches[1]) {
        return matches[1].replace(/['"]/g, '');
      }
    }
    return null;
  }

  private saveFile(blob: Blob, fileName: string) {
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(link.href);
  }
}
