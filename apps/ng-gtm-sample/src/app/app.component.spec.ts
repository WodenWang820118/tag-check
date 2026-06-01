import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppComponent } from './app.component';
import { SeoService } from './seo/seo.service';
import { ConsentService } from './shared/services/consent/consent.service';
import { LoadingService } from './shared/services/loading/loading.service';
import { UrlTrackerService } from './shared/services/url-tracker/url-tracker.service';

describe('AppComponent', () => {
  const seoService = {
    start: vi.fn()
  };
  const urlTrackerService = {
    initializeUrlTracking: vi.fn()
  };
  const loadingService = {
    getLoadingState: vi.fn(() => signal(false))
  };
  const consentServiceFactory = vi.fn(() => ({}));

  beforeEach(() => {
    TestBed.resetTestingModule();
    seoService.start.mockReset();
    urlTrackerService.initializeUrlTracking.mockReset();
    loadingService.getLoadingState.mockClear();
    consentServiceFactory.mockClear();
    delete (globalThis as { dataLayer?: Array<Record<string, unknown>> })
      .dataLayer;
  });

  it('instantiates the consent service globally when the app starts', () => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        {
          provide: SeoService,
          useValue: seoService
        },
        {
          provide: UrlTrackerService,
          useValue: urlTrackerService
        },
        {
          provide: LoadingService,
          useValue: loadingService
        },
        {
          provide: ConsentService,
          useFactory: consentServiceFactory
        }
      ]
    });

    const fixture: ComponentFixture<AppComponent> =
      TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(consentServiceFactory).toHaveBeenCalledTimes(1);
    expect(seoService.start).toHaveBeenCalledTimes(1);
    expect(urlTrackerService.initializeUrlTracking).toHaveBeenCalledTimes(1);
  });
});
