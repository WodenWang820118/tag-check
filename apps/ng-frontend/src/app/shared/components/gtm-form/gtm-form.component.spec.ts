import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { environment } from '../../../../environments/environment';
import { GtmFormComponent } from './gtm-form.component';

describe('GtmFormComponent', () => {
  it('disables accompanied mode when Preview Mode URL is empty, and enables it when provided', async () => {
    const projectInfo = {
      projectSlug: 'demo',
      measurementId: 'G-12345',
      applicationSettings: {
        gtm: {
          gtmPreviewModeUrl: '',
          tagManagerUrl: 'https://tagmanager.google.com',
          isAccompanyMode: false,
          isRequestCheck: false
        }
      }
    };
    await TestBed.configureTestingModule({
      imports: [GtmFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: MatSnackBar, useValue: { openFromComponent: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ projectInfo }),
            parent: { params: of({ projectSlug: 'demo' }) }
          }
        }
      ]
    }).compileComponents();
    const fixture = TestBed.createComponent(GtmFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    // Initially empty preview URL -> accompanied mode disabled & false
    expect(comp.f.isAccompanyMode().disabled()).toBe(true);
    expect(comp.f.isAccompanyMode().value()).toBe(false);

    // Provide preview URL -> accompanied mode enables
    comp.f
      .gtmPreviewModeUrl()
      .value.set('https://tagassistant.google.com/?id=GTM-123');
    fixture.detectChanges();

    expect(comp.f.isAccompanyMode().disabled()).toBe(false);
    comp.f.isAccompanyMode().value.set(true);
    expect(comp.f.isAccompanyMode().value()).toBe(true);

    // Clear preview URL via onReset() -> accompanied mode disables and resets to false
    comp.onReset();
    fixture.detectChanges();

    expect(comp.f.gtmPreviewModeUrl().value()).toBe('');
    expect(comp.f.isAccompanyMode().disabled()).toBe(true);
    expect(comp.f.isAccompanyMode().value()).toBe(false);
  });

  it('enables request check only when measurement ID is present', async () => {
    const projectWithoutMeasurement = {
      projectSlug: 'demo',
      measurementId: '',
      applicationSettings: {
        gtm: {
          gtmPreviewModeUrl: 'https://tagassistant.google.com',
          tagManagerUrl: '',
          isAccompanyMode: true,
          isRequestCheck: false
        }
      }
    };
    await TestBed.configureTestingModule({
      imports: [GtmFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: MatSnackBar, useValue: { openFromComponent: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ projectInfo: projectWithoutMeasurement }),
            parent: { params: of({ projectSlug: 'demo' }) }
          }
        }
      ]
    }).compileComponents();
    const fixture = TestBed.createComponent(GtmFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.hasMeasurementId()).toBe(false);
    expect(comp.f.isRequestCheck().disabled()).toBe(true);
    expect(comp.f.isRequestCheck().value()).toBe(false);
  });

  it('enables request check when measurement ID exists and allows toggling', async () => {
    const projectWithMeasurement = {
      projectSlug: 'demo',
      measurementId: 'G-XYZ123',
      applicationSettings: {
        gtm: {
          gtmPreviewModeUrl: '',
          tagManagerUrl: '',
          isAccompanyMode: false,
          isRequestCheck: true
        }
      }
    };
    await TestBed.configureTestingModule({
      imports: [GtmFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: MatSnackBar, useValue: { openFromComponent: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ projectInfo: projectWithMeasurement }),
            parent: { params: of({ projectSlug: 'demo' }) }
          }
        }
      ]
    }).compileComponents();
    const fixture = TestBed.createComponent(GtmFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.hasMeasurementId()).toBe(true);
    expect(comp.f.isRequestCheck().disabled()).toBe(false);
    expect(comp.f.isRequestCheck().value()).toBe(true);
  });

  it('navigates to project-info when request check is disabled and info is clicked', async () => {
    const projectInfo = {
      projectSlug: 'demo',
      measurementId: '',
      applicationSettings: {
        gtm: {
          gtmPreviewModeUrl: '',
          tagManagerUrl: '',
          isAccompanyMode: false,
          isRequestCheck: false
        }
      }
    };
    const router = { navigate: vi.fn() };
    const route = {
      data: of({ projectInfo }),
      parent: { params: of({ projectSlug: 'demo' }) }
    };
    await TestBed.configureTestingModule({
      imports: [GtmFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: MatSnackBar, useValue: { openFromComponent: vi.fn() } },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route }
      ]
    }).compileComponents();
    const fixture = TestBed.createComponent(GtmFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.goToProjectInfo();
    expect(router.navigate).toHaveBeenCalledWith(['../project-info'], {
      relativeTo: route
    });
  });

  it('saves the GTM settings on submit', async () => {
    const projectInfo = {
      projectSlug: 'demo',
      measurementId: 'G-12345',
      applicationSettings: {
        gtm: {
          gtmPreviewModeUrl: 'https://tagassistant.google.com',
          tagManagerUrl: 'https://tagmanager.google.com',
          isAccompanyMode: true,
          isRequestCheck: true
        }
      }
    };
    await TestBed.configureTestingModule({
      imports: [GtmFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: MatSnackBar, useValue: { openFromComponent: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ projectInfo }),
            parent: { params: of({ projectSlug: 'demo' }) }
          }
        }
      ]
    }).compileComponents();
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(GtmFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    const saving = comp.onSubmit();
    const save = await vi.waitFor(() =>
      http.expectOne(`${environment.settingsApiUrl}/demo/application`)
    );
    expect(save.request.method).toBe('PUT');
    expect(save.request.body).toEqual({
      gtm: {
        gtmPreviewModeUrl: 'https://tagassistant.google.com',
        tagManagerUrl: 'https://tagmanager.google.com',
        isAccompanyMode: true,
        isRequestCheck: true
      }
    });
    save.flush({ applicationSettings: { gtm: save.request.body.gtm } });
    await saving;
    http.verify();
  });
});
