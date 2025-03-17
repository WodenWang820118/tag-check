import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SetupConstructorService {
  googleTagName: BehaviorSubject<string> = new BehaviorSubject<string>('');
  measurementId: BehaviorSubject<string> = new BehaviorSubject<string>('');
  includeItemScopedVariables: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  isSendingEcommerceData: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);

  setGoogleTagName(name: string) {
    this.googleTagName.next(name);
  }

  getGoogleTagName() {
    return this.googleTagName.asObservable();
  }

  setMeasurementId(id: string) {
    this.measurementId.next(id);
  }

  getMeasurementId() {
    return this.measurementId.asObservable();
  }

  setIncludeItemScopedVariables(include: boolean) {
    this.includeItemScopedVariables.next(include);
  }

  getIncludeItemScopedVariables() {
    return this.includeItemScopedVariables.asObservable();
  }

  setIsSendingEcommerceData(isSending: boolean) {
    this.isSendingEcommerceData.next(isSending);
  }

  getIsSendingEcommerceData() {
    return this.isSendingEcommerceData.asObservable();
  }
}
