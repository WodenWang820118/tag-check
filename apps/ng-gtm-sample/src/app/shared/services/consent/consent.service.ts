import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  computed,
  Injectable,
  PLATFORM_ID,
  inject,
  signal
} from '@angular/core';

export interface ConsentCategories {
  analytics: boolean;
  measurement: boolean;
  audience: boolean;
}

export interface ConsentPreferences {
  analytics_storage: boolean;
  ad_storage: boolean;
  ad_user_data: boolean;
  ad_personalization: boolean;
}

const DEFAULT_CONSENT_CATEGORIES: ConsentCategories = {
  analytics: false,
  measurement: false,
  audience: false
};

const DEFAULT_CONSENT_PREFERENCES: ConsentPreferences = {
  analytics_storage: false,
  ad_storage: false,
  ad_user_data: false,
  ad_personalization: false
};

const CONSENT_CATEGORIES_STORAGE_KEY = 'consentCategories';
const CONSENT_PREFERENCES_STORAGE_KEY = 'consentPreferences';

export const GTM_CONTAINER_ID = 'GTM-NBMX2DWS';
export const GTM_SCRIPT_ID = `gtm-script-${GTM_CONTAINER_ID}`;
export const GTM_SCRIPT_SRC = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`;

@Injectable({
  providedIn: 'root'
})
export class ConsentService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly document = inject(DOCUMENT);
  private readonly consentCategories = signal<ConsentCategories>(
    DEFAULT_CONSENT_CATEGORIES
  );
  private readonly consentPreferences = signal<ConsentPreferences>(
    DEFAULT_CONSENT_PREFERENCES
  );

  readonly consentCategories$ = computed(() => this.consentCategories());
  readonly consentPreferences$ = computed(() => this.consentPreferences());
  readonly analyticsConsentGiven$ = computed(
    () => this.consentCategories().analytics
  );
  readonly measurementConsentGiven$ = computed(
    () => this.consentCategories().measurement
  );
  readonly audienceConsentGiven$ = computed(
    () => this.consentCategories().audience
  );

  constructor() {
    if (!this.getConsentStatus()) {
      this.initConsentPreferences();
      return;
    }

    const storedConsentCategories = this.loadStoredConsentCategories();

    if (storedConsentCategories) {
      this.applyConsentCategories(storedConsentCategories, {
        persist: false,
        syncDataLayer: true,
        loadGtmWhenGranted: true
      });
      return;
    }

    const legacyConsentPreferences = this.loadStoredConsentPreferences();

    if (legacyConsentPreferences) {
      this.applyConsentCategories(
        this.deriveCategoriesFromLegacyPreferences(legacyConsentPreferences),
        {
          persist: false,
          syncDataLayer: true,
          loadGtmWhenGranted: true
        }
      );
      return;
    }

    this.initConsentPreferences();
  }

  initConsentPreferences() {
    this.setConsentCategories(DEFAULT_CONSENT_CATEGORIES, { persist: false });
  }

  setConsentPreferences(consentPreferences: ConsentPreferences) {
    this.updateConsentPreferences(consentPreferences);
  }

  setConsentCategories(
    consentCategories: ConsentCategories,
    options: { persist: boolean } = { persist: true }
  ) {
    const normalizedCategories =
      this.normalizeConsentCategories(consentCategories);
    this.consentCategories.set(normalizedCategories);
    this.consentPreferences.set(
      this.deriveConsentPreferences(normalizedCategories)
    );

    if (this.browser && options.persist) {
      this.setLocalStorageItem(
        CONSENT_CATEGORIES_STORAGE_KEY,
        JSON.stringify(normalizedCategories)
      );
      this.setLocalStorageItem(
        CONSENT_PREFERENCES_STORAGE_KEY,
        JSON.stringify(this.consentPreferences())
      );
    }
  }

  loadStoredConsentCategories(): ConsentCategories | null {
    if (!this.browser) {
      return null;
    }

    const storedCategories = this.getLocalStorageItem(
      CONSENT_CATEGORIES_STORAGE_KEY
    );

    if (!storedCategories) {
      return null;
    }

    try {
      return this.normalizeConsentCategories(JSON.parse(storedCategories));
    } catch {
      return null;
    }
  }

  loadStoredConsentPreferences(): ConsentPreferences | null {
    if (!this.browser) {
      return null;
    }

    const storedPreferences = this.getLocalStorageItem(
      CONSENT_PREFERENCES_STORAGE_KEY
    );

    if (!storedPreferences) {
      return null;
    }

    try {
      return this.normalizeConsentPreferences(JSON.parse(storedPreferences));
    } catch {
      return null;
    }
  }

  updateConsentCategories(consentCategories: ConsentCategories) {
    this.applyConsentCategories(consentCategories, {
      persist: true,
      syncDataLayer: true,
      loadGtmWhenGranted: true
    });
  }

  updateConsentPreferences(consentPreferences: ConsentPreferences) {
    this.applyConsentCategories(
      this.deriveCategoriesFromLegacyPreferences(consentPreferences),
      {
        persist: true,
        syncDataLayer: true,
        loadGtmWhenGranted: true
      }
    );
  }

  hasConsent() {
    if (this.browser) {
      this.setLocalStorageItem('consent', 'true');
    }
  }

  getConsentStatus() {
    if (!this.browser) {
      return false;
    }

    try {
      return JSON.parse(this.getLocalStorageItem('consent') || 'false');
    } catch {
      return false;
    }
  }

  private applyConsentCategories(
    consentCategories: ConsentCategories,
    options: {
      persist: boolean;
      syncDataLayer: boolean;
      loadGtmWhenGranted: boolean;
    }
  ) {
    this.setConsentCategories(consentCategories, { persist: options.persist });

    if (options.syncDataLayer) {
      this.syncConsentToDataLayer(this.consentPreferences());
    }

    if (
      options.loadGtmWhenGranted &&
      this.canLoadGtm(this.consentCategories())
    ) {
      this.loadGtmScript();
    }
  }

  private deriveConsentPreferences(
    consentCategories: ConsentCategories
  ): ConsentPreferences {
    return {
      analytics_storage: consentCategories.analytics,
      ad_storage: consentCategories.measurement || consentCategories.audience,
      ad_user_data: consentCategories.measurement || consentCategories.audience,
      ad_personalization: consentCategories.audience
    };
  }

  private deriveCategoriesFromLegacyPreferences(
    consentPreferences: ConsentPreferences
  ): ConsentCategories {
    const legacy = this.normalizeConsentPreferences(consentPreferences);
    const audience = !!(
      legacy.ad_personalization &&
      legacy.ad_storage &&
      legacy.ad_user_data
    );

    return {
      analytics: !!legacy.analytics_storage,
      audience,
      measurement: !!(legacy.ad_storage && legacy.ad_user_data && !audience)
    };
  }

  private normalizeConsentCategories(input: Partial<ConsentCategories> | null) {
    return {
      analytics: !!input?.analytics,
      measurement: !!input?.measurement,
      audience: !!input?.audience
    };
  }

  private normalizeConsentPreferences(
    input: Partial<ConsentPreferences> | null
  ): ConsentPreferences {
    return {
      analytics_storage: !!input?.analytics_storage,
      ad_storage: !!input?.ad_storage,
      ad_user_data: !!input?.ad_user_data,
      ad_personalization: !!input?.ad_personalization
    };
  }

  private syncConsentToDataLayer(consentPreferences: ConsentPreferences) {
    if (!this.browser) {
      return;
    }

    this.getDataLayer().push({
      event: 'update_consent',
      ...this.toDataLayerConsent(consentPreferences)
    });
  }

  private toDataLayerConsent(consentPreferences: ConsentPreferences) {
    return {
      ad_storage: consentPreferences.ad_storage ? 'granted' : 'denied',
      analytics_storage: consentPreferences.analytics_storage
        ? 'granted'
        : 'denied',
      ad_user_data: consentPreferences.ad_user_data ? 'granted' : 'denied',
      ad_personalization: consentPreferences.ad_personalization
        ? 'granted'
        : 'denied'
    };
  }

  private canLoadGtm(consentCategories: ConsentCategories) {
    return (
      consentCategories.analytics ||
      consentCategories.measurement ||
      consentCategories.audience
    );
  }

  private loadGtmScript() {
    if (!this.browser || this.document.getElementById(GTM_SCRIPT_ID)) {
      return;
    }

    this.getDataLayer().push({
      'gtm.start': Date.now(),
      event: 'gtm.js'
    });

    const script = this.document.createElement('script');
    script.id = GTM_SCRIPT_ID;
    script.async = true;
    script.src = GTM_SCRIPT_SRC;
    this.document.head.appendChild(script);
  }

  private getLocalStorageItem(key: string) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private setLocalStorageItem(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage failures so privacy-restricted browsers can still run
      // with in-memory consent defaults.
    }
  }

  private getDataLayer(): Array<Record<string, unknown>> {
    const scope = globalThis as unknown as {
      dataLayer?: Array<Record<string, unknown>>;
    };
    scope.dataLayer ??= [];
    return scope.dataLayer;
  }
}
