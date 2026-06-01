import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ConsentCategories,
  ConsentPreferences,
  ConsentService,
  GTM_SCRIPT_ID,
  GTM_SCRIPT_SRC
} from './consent.service';

const allCategories: ConsentCategories = {
  analytics: true,
  measurement: true,
  audience: true
};

const deniedCategories: ConsentCategories = {
  analytics: false,
  measurement: false,
  audience: false
};

const deniedConsent: ConsentPreferences = {
  analytics_storage: false,
  ad_storage: false,
  ad_user_data: false,
  ad_personalization: false
};

function configureConsentService(platformId = 'browser') {
  TestBed.configureTestingModule({
    providers: [
      ConsentService,
      {
        provide: PLATFORM_ID,
        useValue: platformId
      }
    ]
  });

  return TestBed.inject(ConsentService);
}

function dataLayer() {
  return (globalThis as { dataLayer: Array<Record<string, unknown>> })
    .dataLayer;
}

function expectLatestConsentUpdate(expected: Record<string, string>) {
  const consentEvents = dataLayer().filter(
    (event) => event['event'] === 'update_consent'
  );

  expect(consentEvents.at(-1)).toEqual({
    event: 'update_consent',
    ...expected
  });
}

function expectGtmLoadAfterConsentUpdate(
  expectedConsent: Record<string, string>
) {
  expect(dataLayer()).toEqual([
    {
      event: 'update_consent',
      ...expectedConsent
    },
    {
      'gtm.start': expect.any(Number),
      event: 'gtm.js'
    }
  ]);
}

function resetBrowserState() {
  localStorage.clear();
  document.getElementById(GTM_SCRIPT_ID)?.remove();
  delete (globalThis as { dataLayer?: Array<Record<string, unknown>> })
    .dataLayer;
}

describe('ConsentService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    resetBrowserState();
  });

  it('initializes default denied categories without loading GTM or writing categories', () => {
    const service = configureConsentService();

    expect(service.consentCategories$()).toEqual(deniedCategories);
    expect(service.consentPreferences$()).toEqual(deniedConsent);
    expect(document.getElementById(GTM_SCRIPT_ID)).toBeNull();
    expect(localStorage.getItem('consentCategories')).toBeNull();
  });

  it('persists consent categories and derives conservative consent preferences', () => {
    const service = configureConsentService();

    service.updateConsentCategories({
      analytics: true,
      measurement: false,
      audience: false
    });

    expect(service.consentCategories$()).toEqual({
      analytics: true,
      measurement: false,
      audience: false
    });
    expect(service.consentPreferences$()).toEqual({
      analytics_storage: true,
      ad_storage: false,
      ad_user_data: false,
      ad_personalization: false
    });
    expect(localStorage.getItem('consentCategories')).toBe(
      JSON.stringify({
        analytics: true,
        measurement: false,
        audience: false
      })
    );
  });

  it('maps measurement-only categories to ad storage and user data without personalization', () => {
    const service = configureConsentService();

    service.updateConsentCategories({
      analytics: false,
      measurement: true,
      audience: false
    });

    expect(service.consentPreferences$()).toEqual({
      analytics_storage: false,
      ad_storage: true,
      ad_user_data: true,
      ad_personalization: false
    });
    expectLatestConsentUpdate({
      ad_storage: 'granted',
      analytics_storage: 'denied',
      ad_user_data: 'granted',
      ad_personalization: 'denied'
    });
  });

  it('restores stored categories at startup before deriving preferences and loading GTM', () => {
    localStorage.setItem('consent', 'true');
    localStorage.setItem(
      'consentCategories',
      JSON.stringify({
        analytics: false,
        measurement: true,
        audience: false
      })
    );
    const appendChildSpy = vi.spyOn(document.head, 'appendChild');

    appendChildSpy.mockImplementation((node: Node) => {
      expectGtmLoadAfterConsentUpdate({
        ad_storage: 'granted',
        analytics_storage: 'denied',
        ad_user_data: 'granted',
        ad_personalization: 'denied'
      });
      return HTMLElement.prototype.appendChild.call(document.head, node);
    });

    const service = configureConsentService();

    expect(service.consentCategories$()).toEqual({
      analytics: false,
      measurement: true,
      audience: false
    });
    expect(service.consentPreferences$()).toEqual({
      analytics_storage: false,
      ad_storage: true,
      ad_user_data: true,
      ad_personalization: false
    });
    expect(document.getElementById(GTM_SCRIPT_ID)).toBeTruthy();

    appendChildSpy.mockRestore();
  });

  it('uses conservative legacy fallback when categories are absent', () => {
    localStorage.setItem('consent', 'true');
    localStorage.setItem(
      'consentPreferences',
      JSON.stringify({
        analytics_storage: true,
        ad_storage: true,
        ad_user_data: true,
        ad_personalization: false
      })
    );

    const service = configureConsentService();

    expect(service.consentCategories$()).toEqual({
      analytics: true,
      measurement: true,
      audience: false
    });
    expect(service.consentPreferences$()).toEqual({
      analytics_storage: true,
      ad_storage: true,
      ad_user_data: true,
      ad_personalization: false
    });
    expect(document.getElementById(GTM_SCRIPT_ID)).toBeTruthy();
  });

  it('handles inconsistent legacy fallback with null/undefined safety', () => {
    localStorage.setItem('consent', 'true');
    localStorage.setItem(
      'consentPreferences',
      JSON.stringify({
        analytics_storage: 1,
        ad_storage: true,
        ad_personalization: true
      })
    );

    const service = configureConsentService();

    expect(service.consentCategories$()).toEqual({
      analytics: true,
      measurement: false,
      audience: false
    });
    expect(service.consentPreferences$()).toEqual({
      analytics_storage: true,
      ad_storage: false,
      ad_user_data: false,
      ad_personalization: false
    });
  });

  it('ignores unconfirmed stored categories and keeps default denied without loading GTM', () => {
    localStorage.setItem(
      'consentCategories',
      JSON.stringify({
        analytics: true,
        measurement: true,
        audience: true
      })
    );

    const service = configureConsentService();

    expect(service.consentCategories$()).toEqual(deniedCategories);
    expect(service.consentPreferences$()).toEqual(deniedConsent);
    expect(document.getElementById(GTM_SCRIPT_ID)).toBeNull();
    expect(
      (globalThis as { dataLayer?: Array<Record<string, unknown>> }).dataLayer
    ).toBeUndefined();
  });

  it('ignores unconfirmed legacy preferences and keeps default denied without loading GTM', () => {
    localStorage.setItem(
      'consentPreferences',
      JSON.stringify({
        analytics_storage: true,
        ad_storage: true,
        ad_user_data: true,
        ad_personalization: true
      })
    );

    const service = configureConsentService();

    expect(service.consentCategories$()).toEqual(deniedCategories);
    expect(service.consentPreferences$()).toEqual(deniedConsent);
    expect(document.getElementById(GTM_SCRIPT_ID)).toBeNull();
  });

  it('falls back to default denied when confirmed stored categories are malformed', () => {
    localStorage.setItem('consent', 'true');
    localStorage.setItem('consentCategories', '{not-json');

    expect(() => configureConsentService()).not.toThrow();

    const service = TestBed.inject(ConsentService);

    expect(service.consentCategories$()).toEqual(deniedCategories);
    expect(service.consentPreferences$()).toEqual(deniedConsent);
    expect(document.getElementById(GTM_SCRIPT_ID)).toBeNull();
  });

  it('loads GTM after analytics-only consent and preserves update_consent', () => {
    const service = configureConsentService();

    service.updateConsentCategories({
      analytics: true,
      measurement: false,
      audience: false
    });

    const script = document.getElementById(GTM_SCRIPT_ID) as HTMLScriptElement;
    expect(script).toBeTruthy();
    expect(script.src).toBe(GTM_SCRIPT_SRC);
    expect(script.async).toBe(true);
    expectGtmLoadAfterConsentUpdate({
      ad_storage: 'denied',
      analytics_storage: 'granted',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  });

  it('loads GTM after measurement-only consent', () => {
    const service = configureConsentService();

    service.updateConsentCategories({
      analytics: false,
      measurement: true,
      audience: false
    });

    expect(document.getElementById(GTM_SCRIPT_ID)).toBeTruthy();
    expectGtmLoadAfterConsentUpdate({
      ad_storage: 'granted',
      analytics_storage: 'denied',
      ad_user_data: 'granted',
      ad_personalization: 'denied'
    });
  });

  it('keeps explicitly denied categories from loading GTM', () => {
    const service = configureConsentService();

    service.updateConsentCategories(deniedCategories);

    expect(document.getElementById(GTM_SCRIPT_ID)).toBeNull();
    expectLatestConsentUpdate({
      ad_storage: 'denied',
      analytics_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  });

  it('does not create duplicate GTM scripts on repeated grants', () => {
    const service = configureConsentService();

    service.updateConsentCategories(allCategories);
    service.updateConsentCategories({
      analytics: true,
      measurement: false,
      audience: false
    });

    expect(document.querySelectorAll(`#${GTM_SCRIPT_ID}`)).toHaveLength(1);
  });

  it('falls back to default consent when stored categories cannot be read', () => {
    const getItemSpy = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new DOMException('blocked', 'SecurityError');
      });

    expect(() => configureConsentService()).not.toThrow();
    expect(document.getElementById(GTM_SCRIPT_ID)).toBeNull();

    getItemSpy.mockRestore();
  });

  it('keeps in-memory category updates when storage writes are blocked', () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('blocked', 'SecurityError');
      });

    const service = configureConsentService();
    service.updateConsentCategories({
      analytics: true,
      measurement: false,
      audience: false
    });

    expect(service.consentCategories$()).toEqual({
      analytics: true,
      measurement: false,
      audience: false
    });
    expect(document.getElementById(GTM_SCRIPT_ID)).toBeTruthy();

    setItemSpy.mockRestore();
  });

  it('stays server-safe without reading storage or loading GTM', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

    const service = configureConsentService('server');
    service.updateConsentCategories(allCategories);

    expect(service.consentCategories$()).toEqual(allCategories);
    expect(getItemSpy).not.toHaveBeenCalled();
    expect(document.getElementById(GTM_SCRIPT_ID)).toBeNull();

    getItemSpy.mockRestore();
  });

  it('correctly sets and retrieves consent status', () => {
    const service = configureConsentService();

    expect(service.getConsentStatus()).toBe(false);

    service.hasConsent();

    expect(service.getConsentStatus()).toBe(true);
    expect(localStorage.getItem('consent')).toBe('true');
  });

  it('safely handles invalid/unparseable consent status', () => {
    const service = configureConsentService();
    localStorage.setItem('consent', 'invalid-json');

    expect(service.getConsentStatus()).toBe(false);
  });
});
