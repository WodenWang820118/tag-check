import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { SettingsService } from '../../services/api/settings/settings.service';
import { environment } from '../../../../environments/environment';
import {
  ApplicationFormComponent,
  toEditableValue
} from './application-form.component';

describe('toEditableValue', () => {
  it('shows stored strings without adding quotes', () => {
    expect(toEditableValue('true')).toBe('true');
    expect(toEditableValue('{"ad_storage":true}')).toBe('{"ad_storage":true}');
  });

  it('shows values saved as objects by older versions as JSON', () => {
    expect(toEditableValue({ ad_storage: true })).toBe('{"ad_storage":true}');
  });
});

describe('ApplicationFormComponent', () => {
  it('saves the website URL with pre-loading values and displays it after reloading settings', async () => {
    const applicationSettings = {
      websiteUrl: 'https://old.example/',
      localStorage: { data: [{ key: 'consent', value: 'true' }] },
      cookie: { data: [{ key: 'locale', value: 'en' }] }
    };
    const routeData = new BehaviorSubject({
      projectInfo: { applicationSettings }
    });
    await TestBed.configureTestingModule({
      imports: [ApplicationFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: MatSnackBar, useValue: { openFromComponent: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: {
            data: routeData,
            parent: { params: of({ projectSlug: 'demo' }) }
          }
        }
      ]
    }).compileComponents();
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ApplicationFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.f.websiteUrl().value.set('https://new.example/shop');
    const saving = comp.onFormSubmit();

    const save = await vi.waitFor(() =>
      http.expectOne(`${environment.settingsApiUrl}/demo/application`)
    );
    const saved = {
      ...applicationSettings,
      websiteUrl: 'https://new.example/shop'
    };
    expect(save.request.method).toBe('PUT');
    expect(save.request.body).toEqual(saved);
    save.flush(saved);
    await saving;
    fixture.destroy();

    TestBed.inject(SettingsService)
      .getProjectSettings('demo')
      .subscribe((projectInfo) => routeData.next({ projectInfo }));
    http.expectOne(`${environment.settingsApiUrl}/demo`).flush({
      applicationSettings: saved
    });
    const reloaded = TestBed.createComponent(ApplicationFormComponent);
    reloaded.detectChanges();
    const input = reloaded.nativeElement.querySelector(
      '[data-testid="preload-website-url"]'
    ) as HTMLInputElement | null;
    expect(input?.value).toBe('https://new.example/shop');
    http.verify();
  });

  it('allows adding and removing localStorage and cookie settings', async () => {
    const applicationSettings = {
      websiteUrl: 'https://example.com/',
      localStorage: { data: [{ key: 'k1', value: 'v1' }] },
      cookie: { data: [{ key: 'c1', value: 'v1' }] }
    };
    await TestBed.configureTestingModule({
      imports: [ApplicationFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: MatSnackBar, useValue: { openFromComponent: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ projectInfo: { applicationSettings } }),
            parent: { params: of({ projectSlug: 'demo' }) }
          }
        }
      ]
    }).compileComponents();
    const fixture = TestBed.createComponent(ApplicationFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.model().localStorage.length).toBe(1);
    comp.addLocalStorageSetting();
    expect(comp.model().localStorage.length).toBe(2);
    expect(comp.isEmptyLocalStorage()).toBe(true);

    comp.removeLocalStorageSetting(1);
    expect(comp.model().localStorage.length).toBe(1);
    expect(comp.isEmptyLocalStorage()).toBe(false);

    expect(comp.model().cookie.length).toBe(1);
    comp.addCookieSetting();
    expect(comp.model().cookie.length).toBe(2);
    expect(comp.isEmptyCookie()).toBe(true);

    comp.removeCookieSetting(1);
    expect(comp.model().cookie.length).toBe(1);
    expect(comp.isEmptyCookie()).toBe(false);
  });
});
