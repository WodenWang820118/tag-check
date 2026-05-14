import { isPlatformBrowser } from '@angular/common';
import {
  computed,
  Injectable,
  PLATFORM_ID,
  inject,
  signal
} from '@angular/core';

export interface ConsentPreferences {
  analytics_storage: boolean;
  ad_storage: boolean;
  ad_user_data: boolean;
  ad_personalization: boolean;
}

const DEFAULT_CONSENT_PREFERENCES: ConsentPreferences = {
  analytics_storage: false,
  ad_storage: false,
  ad_user_data: false,
  ad_personalization: false
};

@Injectable({
  providedIn: 'root'
})
export class ConsentService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly consentPreferences = signal<ConsentPreferences>(
    DEFAULT_CONSENT_PREFERENCES
  );

  readonly consentPreferences$ = computed(() => this.consentPreferences());
  readonly analyticsConsentGiven$ = computed(() => {
    const consentOptions = this.consentPreferences();
    return (
      consentOptions.analytics_storage &&
      consentOptions.ad_storage &&
      consentOptions.ad_user_data
    );
  });
  readonly measurementConsentGiven$ = computed(() => {
    const consentOptions = this.consentPreferences();
    return consentOptions.ad_storage && consentOptions.ad_user_data;
  });
  readonly audienceConsentGiven$ = computed(() => {
    const consentOptions = this.consentPreferences();
    return (
      consentOptions.ad_storage &&
      consentOptions.ad_user_data &&
      consentOptions.ad_personalization
    );
  });

  initConsentPreferences() {
    this.setConsentPreferences(DEFAULT_CONSENT_PREFERENCES);
  }

  setConsentPreferences(consentPreferences: ConsentPreferences) {
    this.consentPreferences.set(consentPreferences);

    if (this.browser) {
      localStorage.setItem(
        'consentPreferences',
        JSON.stringify(consentPreferences)
      );
    }
  }

  loadStoredConsentPreferences(): ConsentPreferences | null {
    if (!this.browser) {
      return null;
    }

    const storedPreferences = localStorage.getItem('consentPreferences');

    if (!storedPreferences) {
      return null;
    }

    try {
      return {
        ...DEFAULT_CONSENT_PREFERENCES,
        ...JSON.parse(storedPreferences)
      } as ConsentPreferences;
    } catch {
      return null;
    }
  }

  updateConsentPreferences(consentPreferences: ConsentPreferences) {
    this.setConsentPreferences(consentPreferences);

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

    if (this.browser) {
      this.getDataLayer().push({
        event: 'update_consent',
        ...consentPreferencesDataLayer
      });
    }
  }

  hasConsent() {
    if (this.browser) {
      localStorage.setItem('consent', 'true');
    }
  }

  getConsentStatus() {
    if (!this.browser) {
      return false;
    }

    return JSON.parse(localStorage.getItem('consent') || 'false');
  }

  private getDataLayer(): Array<Record<string, unknown>> {
    const scope = globalThis as unknown as {
      dataLayer?: Array<Record<string, unknown>>;
    };
    scope.dataLayer ??= [];
    return scope.dataLayer;
  }
}
