import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Project } from '../../models/project.interface';
import { BehaviorSubject, Subject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RecordingService {
  mockUrl = 'http://localhost:3001/recordings';

  recordingSubject: Subject<any> = new BehaviorSubject('');
  recording$ = this.recordingSubject.asObservable();

  constructor(private http: HttpClient) {}

  getRecordings() {
    this.http.get(this.mockUrl);
  }

  getRecordingByEventName(eventName: string | undefined) {
    if (!eventName) return;
    return this.http.get<any>(`${this.mockUrl}/${eventName}`);
  }
}
