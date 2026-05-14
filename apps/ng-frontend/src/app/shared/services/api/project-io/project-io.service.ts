import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { catchError, EMPTY, throwError } from 'rxjs';
import { catchHttpError } from '../http-error.utils';

@Injectable({
  providedIn: 'root'
})
export class ProjectIoService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Exports a project as a ZIP file and triggers a browser download.
   *
   * Failures are swallowed since the operation has no observable consumer.
   *
   * @param projectSlug - URL-friendly project identifier.
   */
  exportProject(projectSlug: string) {
    this.http
      .get(`${environment.projectApiUrl}/export/${projectSlug}`, {
        responseType: 'blob'
      })
      .pipe(catchHttpError(null))
      .subscribe((blob) => {
        if (blob) {
          // Create a new Blob object using the response data of the file
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `${projectSlug}.zip`; // A default filename if none is specified by headers
          a.click();

          URL.revokeObjectURL(a.href);
        }
      });
  }

  importProject(file: File | null) {
    if (!file) {
      return EMPTY;
    }
    const formData = new FormData();
    formData.append('file', file); // 'file' is the field name you'll access on the server
    console.log('formData', formData.get('file'));
    return this.http
      .post(`${environment.projectApiUrl}/import`, formData, {
        reportProgress: true,
        observe: 'events'
      })
      .pipe(
        catchError((error) => {
          console.error(error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Deletes a project by its slug.
   *
   * Returns `null` on HTTP failure.
   *
   * @param projectSlug - URL-friendly project identifier.
   */
  deleteProject(projectSlug: string) {
    return this.http
      .delete(`${environment.projectApiUrl}/delete/${projectSlug}`)
      .pipe(catchHttpError(null));
  }
}
