import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, of, switchMap } from 'rxjs';
import { ProjectReport, ReportDetails } from '../../../models/report.interface';
import { FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  mockUrl = 'http://localhost:3004/reports';

  reportsSubject: Subject<Report> = new BehaviorSubject({} as Report);
  reports$ = this.reportsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getReports() {
    return this.http.get<Report[]>(this.mockUrl);
  }

  getProjectReports(projectSlug: string) {
    return this.http.get<ProjectReport>(`${this.mockUrl}/${projectSlug}`);
  }

  updateReport(projectSlug: string, report: ProjectReport) {
    if (!projectSlug || !report) return of({} as ProjectReport);
    return this.http.put<ProjectReport>(
      `${this.mockUrl}/${projectSlug}`,
      report
    );
  }

  addReport(reportForm: FormGroup) {
    const projectSlug = reportForm.controls['projectSlug'].value;
    const spec = reportForm.controls['spec'].value;
    const eventName = JSON.parse(spec).event;

    const reportDetails: ReportDetails = {
      eventName: eventName,
      passed: false,
      dataLayerSpec: JSON.parse(spec),
      incorrectInfo: [],
      completedTime: new Date(),
      dataLayer: {},
      message: '',
    };

    return this.getProjectReports(projectSlug).pipe(
      switchMap((projectReports) => {
        const updatedReport: ProjectReport = {
          ...projectReports,
          reports: [...projectReports.reports, reportDetails],
        };
        return this.updateReport(projectSlug, updatedReport);
      })
    );
  }
}
