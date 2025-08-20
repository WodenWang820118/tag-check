import { computed, Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SetupConstructorService {
  // googleTagName: BehaviorSubject<string> = new BehaviorSubject<string>('');
  // measurementId: BehaviorSubject<string> = new BehaviorSubject<string>('');
  // includeItemScopedVariables: BehaviorSubject<boolean> =
  //   new BehaviorSubject<boolean>(false);
  // isSendingEcommerceData: BehaviorSubject<boolean> =
  //   new BehaviorSubject<boolean>(false);

  private readonly googleTagName = signal<string>('Google Tag');
  googleTagName$ = computed(() => this.googleTagName());
  private readonly measurementId = signal<string>('G-XXXXXXXXXX');
  measurementId$ = computed(() => this.measurementId());
  private readonly includeItemScopedVariables = signal<boolean>(false);
  includeItemScopedVariables$ = computed(() =>
    this.includeItemScopedVariables()
  );
  private readonly isSendingEcommerceData = signal<boolean>(false);
  isSendingEcommerceData$ = computed(() => this.isSendingEcommerceData());

  setGoogleTagName(name: string) {
    this.googleTagName.set(name);
  }

  // getGoogleTagName() {
  //   return this.googleTagName$;
  // }

  setMeasurementId(id: string) {
    this.measurementId.set(id);
  }

  // getMeasurementId() {
  //   return this.measurementId$;
  // }

  setIncludeItemScopedVariables(include: boolean) {
    this.includeItemScopedVariables.set(include);
  }

  // getIncludeItemScopedVariables() {
  //   return this.includeItemScopedVariables$;
  // }

  setIsSendingEcommerceData(isSending: boolean) {
    this.isSendingEcommerceData.set(isSending);
  }

  // getIsSendingEcommerceData() {
  //   return this.isSendingEcommerceData$;
  // }
}
