import { computed, Injectable, signal } from '@angular/core';

interface ConsentPreferences {
  analytics_storage: boolean;
  ad_storage: boolean;
  ad_user_data: boolean;
  ad_personalization: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConsentService {
  private readonly consentPreferences = signal<ConsentPreferences>({
    analytics_storage: false,
    ad_storage: false,
    ad_user_data: false,
    ad_personalization: false
  });

  readonly consentPreferences$ = computed(() => this.consentPreferences());

  constructor() {}

  initConsentPreferences() {
    const initialConsentPreferences = {
      analytics_storage: false,
      ad_storage: false,
      ad_user_data: false,
      ad_personalization: false
    };

    this.setConsetPreferences(initialConsentPreferences);
  }

  setConsetPreferences(consentPreferences: ConsentPreferences) {
    localStorage.setItem(
      'consentPreferences',
      JSON.stringify(consentPreferences)
    );
    this.consentPreferences.set(consentPreferences);
  }

  analyticsConsentGiven$() {
    const analyticsConsentGiven$ = computed(() => {
      const consentOptions = this.consentPreferences();
      return (
        consentOptions.analytics_storage &&
        consentOptions.ad_storage &&
        consentOptions.ad_user_data
      );
    });
    return analyticsConsentGiven$;
  }

  measurementConsentGiven$() {
    const measurementConsentGiven$ = computed(() => {
      const consentOptions = this.consentPreferences();
      return consentOptions.ad_storage && consentOptions.ad_user_data;
    });
    return measurementConsentGiven$;
  }

  audienceConsentGiven$() {
    const audienceConsentGiven$ = computed(() => {
      const consentOptions = this.consentPreferences();
      return (
        consentOptions.ad_storage &&
        consentOptions.ad_user_data &&
        consentOptions.ad_personalization
      );
    });
    return audienceConsentGiven$;
  }

  getConsentPreferences() {
    return JSON.parse(localStorage.getItem('consentPreferences') || '{}');
  }

  updateConsentPreferences(consentPreferences: ConsentPreferences) {
    this.setConsetPreferences(consentPreferences);

    const consentPreferencesDataLayer = {
      ad_storage: consentPreferences.ad_storage ? 'granted' : 'denied',
      analytics_storage: consentPreferences.analytics_storage
        ? 'granted'
        : 'denied',
      ad_user_data: consentPreferences.ad_user_data ? 'granted' : 'denied',
      ad_personalization: consentPreferences.ad_personalization
        ? 'granted'
        : 'denied'
    };

    (globalThis as any).dataLayer.push({
      event: 'update_consent',
      ...consentPreferencesDataLayer
    });
  }

  hasConsent() {
    localStorage.setItem('consent', 'true');
  }

  getConsentStatus() {
    return JSON.parse(localStorage.getItem('consent') || 'false');
  }
}
