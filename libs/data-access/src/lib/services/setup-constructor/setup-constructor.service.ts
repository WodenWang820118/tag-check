import { computed, Injectable, signal } from '@angular/core';

/**
 * Holds tag-build's setup options: the Google tag name, the measurement ID,
 * item-scoped variables and whether event tags send ecommerce data.
 */
@Injectable({
  providedIn: 'root'
})
export class SetupConstructorService {
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

  setMeasurementId(id: string) {
    this.measurementId.set(id);
  }

  setIncludeItemScopedVariables(include: boolean) {
    this.includeItemScopedVariables.set(include);
  }

  setIsSendingEcommerceData(isSending: boolean) {
    this.isSendingEcommerceData.set(isSending);
  }
}
