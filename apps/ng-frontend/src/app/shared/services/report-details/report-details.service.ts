import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IReportDetails } from '../../../../../../../libs/utils/src/lib/interfaces/report.interface';

@Injectable({
  providedIn: 'root',
})
export class ReportDetailsService {
  reportDetailsSubject = new BehaviorSubject<IReportDetails | undefined>(
    undefined
  );
  reportDetails$ = this.reportDetailsSubject.asObservable();

  recordingSubject = new BehaviorSubject<any | undefined>(undefined);
  recording$ = this.recordingSubject.asObservable();

  setReportDetails(reportDetails: IReportDetails | undefined) {
    if (!reportDetails) return;
    this.reportDetailsSubject.next(reportDetails);
  }

  setRecording(recording: any | undefined) {
    if (!recording) return;
    this.recordingSubject.next(recording);
  }
}
