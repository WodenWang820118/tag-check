import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ConsentCategories,
  ConsentService
} from '../../services/consent/consent.service';
import { CookieConsentComponent } from './cookie-consent.component';

function createConsentServiceMock(initialCategories: ConsentCategories) {
  const categories = signal<ConsentCategories>(initialCategories);

  return {
    consentCategories$: () => categories(),
    updateConsentCategories: vi.fn((nextCategories: ConsentCategories) => {
      categories.set(nextCategories);
    }),
    hasConsent: vi.fn()
  };
}

describe('CookieConsentComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  it('keeps local measurement model off when analytics is toggled before save', async () => {
    const consentService = createConsentServiceMock({
      analytics: false,
      measurement: false,
      audience: false
    });

    await TestBed.configureTestingModule({
      imports: [CookieConsentComponent],
      providers: [
        provideNoopAnimations(),
        {
          provide: ConsentService,
          useValue: consentService
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(CookieConsentComponent);
    fixture.detectChanges();

    fixture.componentInstance.analyticsModel = true;
    fixture.detectChanges();

    expect(fixture.componentInstance.analyticsModel).toBe(true);
    expect(fixture.componentInstance.measurementModel).toBe(false);
    expect(fixture.componentInstance.audienceModel).toBe(false);
    expect(consentService.updateConsentCategories).not.toHaveBeenCalled();
  });

  it('allows local measurement to turn off while analytics remains on without saving', async () => {
    const consentService = createConsentServiceMock({
      analytics: true,
      measurement: true,
      audience: false
    });

    await TestBed.configureTestingModule({
      imports: [CookieConsentComponent],
      providers: [
        provideNoopAnimations(),
        {
          provide: ConsentService,
          useValue: consentService
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(CookieConsentComponent);
    fixture.detectChanges();

    fixture.componentInstance.measurementModel = false;
    fixture.detectChanges();

    expect(fixture.componentInstance.analyticsModel).toBe(true);
    expect(fixture.componentInstance.measurementModel).toBe(false);
    expect(fixture.componentInstance.audienceModel).toBe(false);
    expect(consentService.updateConsentCategories).not.toHaveBeenCalled();
  });

  it('restores confirmed stored categories into the UI models', async () => {
    localStorage.setItem('consent', 'true');
    localStorage.setItem(
      'consentCategories',
      JSON.stringify({
        analytics: true,
        measurement: false,
        audience: true
      })
    );

    await TestBed.configureTestingModule({
      imports: [CookieConsentComponent],
      providers: [provideNoopAnimations()]
    }).compileComponents();

    const fixture = TestBed.createComponent(CookieConsentComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.analyticsModel).toBe(true);
    expect(fixture.componentInstance.measurementModel).toBe(false);
    expect(fixture.componentInstance.audienceModel).toBe(true);
  });

  it('allow all grants every first-class consent category', async () => {
    const consentService = createConsentServiceMock({
      analytics: false,
      measurement: false,
      audience: false
    });

    await TestBed.configureTestingModule({
      imports: [CookieConsentComponent],
      providers: [
        provideNoopAnimations(),
        {
          provide: ConsentService,
          useValue: consentService
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(CookieConsentComponent);
    fixture.detectChanges();

    fixture.componentInstance.acceptAll();
    fixture.detectChanges();

    expect(consentService.updateConsentCategories).toHaveBeenLastCalledWith({
      analytics: true,
      measurement: true,
      audience: true
    });
    expect(consentService.hasConsent).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.analyticsModel).toBe(true);
    expect(fixture.componentInstance.measurementModel).toBe(true);
    expect(fixture.componentInstance.audienceModel).toBe(true);
    expect(fixture.componentInstance.showModal()).toBe(false);
  });

  it('disables all dialog close controls that bypass explicit preference actions', async () => {
    const consentService = createConsentServiceMock({
      analytics: false,
      measurement: false,
      audience: false
    });

    await TestBed.configureTestingModule({
      imports: [CookieConsentComponent],
      providers: [
        provideNoopAnimations(),
        {
          provide: ConsentService,
          useValue: consentService
        }
      ]
    }).compileComponents();

    const fixture: ComponentFixture<CookieConsentComponent> =
      TestBed.createComponent(CookieConsentComponent);
    fixture.detectChanges();

    const dialog = fixture.debugElement.query(By.css('p-dialog'))
      .componentInstance as {
      closable: boolean;
      closeOnEscape: boolean;
      dismissableMask: boolean;
    };

    expect(dialog.closable).toBe(false);
    expect(dialog.closeOnEscape).toBe(false);
    expect(dialog.dismissableMask).toBe(false);
  });

  it('commits local models only when Save Preferences is confirmed', async () => {
    const consentService = createConsentServiceMock({
      analytics: false,
      measurement: false,
      audience: false
    });

    await TestBed.configureTestingModule({
      imports: [CookieConsentComponent],
      providers: [
        provideNoopAnimations(),
        {
          provide: ConsentService,
          useValue: consentService
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(CookieConsentComponent);
    fixture.detectChanges();

    fixture.componentInstance.show();
    fixture.componentInstance.analyticsModel = true;
    fixture.componentInstance.measurementModel = false;
    fixture.componentInstance.audienceModel = true;
    fixture.detectChanges();

    expect(consentService.updateConsentCategories).not.toHaveBeenCalled();

    fixture.componentInstance.savePreferences();
    fixture.detectChanges();

    expect(consentService.updateConsentCategories).toHaveBeenLastCalledWith({
      analytics: true,
      measurement: false,
      audience: true
    });
    expect(consentService.hasConsent).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.showModal()).toBe(false);
  });
});
