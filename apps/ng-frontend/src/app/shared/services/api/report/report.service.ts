import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  forkJoin,
  of
} from 'rxjs';
import { ProjectReport, IReportDetails } from '@utils';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  reportsSubject: Subject<Report> = new BehaviorSubject({} as Report);
  reports$ = this.reportsSubject.asObservable();

  fileContent = new BehaviorSubject<any>(null);
  fileContent$ = this.fileContent.asObservable();

  constructor(private http: HttpClient) {}

  getReports() {
    return this.http.get<Report[]>(environment.reportApiUrl).pipe(
      catchError((error) => {
        console.error(error);
        return of([]);
      })
    );
  }

  getProjectReports(projectSlug: string) {
    return this.http
      .get<ProjectReport>(`${environment.reportApiUrl}/${projectSlug}`)
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }

  getProjectReportNames(projectSlug: string) {
    return this.http
      .get<string[]>(`${environment.reportApiUrl}/${projectSlug}/names`)
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }

  updateReport(projectSlug: string, report: ProjectReport) {
    if (!projectSlug || !report) return of({} as ProjectReport);
    return this.http
      .put<ProjectReport>(`${environment.reportApiUrl}/${projectSlug}`, report)
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }

  addReport(
    projectSlug: string,
    eventId: string,
    reportDetails: IReportDetails
  ) {
    // TODO: use SQLite3 to store the report details
    return this.http
      .post<ProjectReport>(
        `${environment.reportApiUrl}/${projectSlug}/${eventId}`,
        reportDetails
      )
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }

  readJsonFileContent(file: File): void {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const fileContentString = e.target.result;

      try {
        // update the file content
        this.fileContent.next(JSON.parse(fileContentString));
      } catch (error) {
        console.error('Error parsing file content', error);
      }
    };

    reader.onerror = () => {
      console.error('Error reading file content');
    };

    reader.readAsText(file);
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
        .delete<ProjectReport>(
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
