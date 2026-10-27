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
    fixture.componentInstance.applicationForm.controls.websiteUrl.setValue(
      'https://new.example/shop'
    );
    fixture.componentInstance.onFormSubmit();

    const save = http.expectOne(
      `${environment.settingsApiUrl}/demo/application`
    );
    const saved = {
      ...applicationSettings,
      websiteUrl: 'https://new.example/shop'
    };
    expect(save.request.method).toBe('PUT');
    expect(save.request.body).toEqual(saved);
    save.flush(saved);
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
});
