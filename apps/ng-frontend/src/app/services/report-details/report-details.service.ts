import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ReportDetails } from '../../models/report.interface';

@Injectable({
  providedIn: 'root',
})
export class ReportDetailsService {
  reportDetailsSubject = new BehaviorSubject<ReportDetails | undefined>(
    undefined
  );
  reportDetails$ = this.reportDetailsSubject.asObservable();

  recordingSubject = new BehaviorSubject<any | undefined>(undefined);
  recording$ = this.recordingSubject.asObservable();

  setReportDetails(reportDetails: ReportDetails | undefined) {
    if (!reportDetails) return;
    this.reportDetailsSubject.next(reportDetails);
  }

  setRecording(recording: any | undefined) {
    if (!recording) return;
    this.recordingSubject.next(recording);
  }
}
