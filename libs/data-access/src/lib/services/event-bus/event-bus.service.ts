import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EventBusService {
  private subjects: { [eventName: string]: Subject<any> } = {};

  // Emit events
  emit(eventName: string, data?: any) {
    if (!this.subjects[eventName]) {
      this.subjects[eventName] = new Subject<any>();
    }
    this.subjects[eventName].next(data);
  }

  // Listen for events
  on(eventName: string): Observable<any> {
    if (!this.subjects[eventName]) {
      this.subjects[eventName] = new Subject<any>();
    }
    return this.subjects[eventName].asObservable();
  }
}
