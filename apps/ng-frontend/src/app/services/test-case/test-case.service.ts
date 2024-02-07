import { Injectable } from '@angular/core';
import { TestCase } from '../../models/project.interface';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TestCaseService {
  testCaseSubject = new BehaviorSubject<TestCase | undefined>(undefined);
  testCase$ = this.testCaseSubject.asObservable();

  recordingSubject = new BehaviorSubject<any | undefined>(undefined);
  recording$ = this.recordingSubject.asObservable();

  setTestCase(testCase: TestCase | undefined) {
    if (!testCase) return;
    this.testCaseSubject.next(testCase);
  }

  setRecording(recording: any | undefined) {
    if (!recording) return;
    this.recordingSubject.next(recording);
  }
}
