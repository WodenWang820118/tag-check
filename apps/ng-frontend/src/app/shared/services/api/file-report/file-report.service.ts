import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { FileReport } from '@utils';

@Injectable({
  providedIn: 'root',
})
export class FileReportService {
  constructor(private http: HttpClient) {}

  getFileReports(projectSlug: string) {
    return this.http
      .get<FileReport[]>(`${environment.fileReportApiUrl}/${projectSlug}`)
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }

  deleteFileReport(projectSlug: string, fileReport: FileReport) {
    return this.http
      .delete<FileReport>(`${environment.fileReportApiUrl}/${projectSlug}`, {
        params: { filePath: fileReport.path },
      })
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }

  deleteFileReports(projectSlug: string, selected: FileReport[]) {
    console.log('to be deleeted: ', selected);
    const tasks = selected.map((fileReport) =>
      this.deleteFileReport(projectSlug, fileReport)
    );

    return forkJoin(tasks);
  }
}
