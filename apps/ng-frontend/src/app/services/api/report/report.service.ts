import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, of, switchMap } from 'rxjs';
import { ProjectReport, ReportDetails } from '../../../models/report.interface';
import { FormGroup } from '@angular/forms';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  mockUrl = 'http://localhost:3004/reports';

  reportsSubject: Subject<Report> = new BehaviorSubject({} as Report);
  reports$ = this.reportsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getReports() {
    return this.http.get<Report[]>(environment.reportApiUrl);
  }

  getProjectReports(projectSlug: string) {
    return this.http.get<ProjectReport>(
      `${environment.reportApiUrl}/${projectSlug}`
    );
  }

  updateReport(projectSlug: string, report: ProjectReport) {
    if (!projectSlug || !report) return of({} as ProjectReport);
    return this.http.put<ProjectReport>(
      `${environment.reportApiUrl}/${projectSlug}`,
      report
    );
  }

  addReport(reportForm: FormGroup, reportDetails: ReportDetails) {
    const projectSlug = reportForm.controls['projectSlug'].value;

    return this.http.post<ProjectReport>(
      `${environment.reportApiUrl}/${projectSlug}`,
      reportDetails
    );
  }
}
