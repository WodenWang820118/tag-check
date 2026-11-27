import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { environment } from '../../../../environments/environment';
import { BrowserFormComponent } from './browser-form.component';

describe('BrowserFormComponent', () => {
  it('loads browser settings from route and updates them on submit', async () => {
    const projectInfo = {
      projectSlug: 'demo',
      browserSettings: {
        headless: false,
        browser: ['--disable-web-security', '--no-sandbox']
      }
    };
    await TestBed.configureTestingModule({
      imports: [BrowserFormComponent],
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
    const fixture = TestBed.createComponent(BrowserFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.f.headless().value()).toBe(false);
    expect(comp.model().settings.length).toBe(2);

    comp.f.headless().value.set(true);
    comp.addBrowserSetting();
    expect(comp.model().settings.length).toBe(3);
    comp.removeBrowserSetting(0);
    expect(comp.model().settings.length).toBe(2);

    const saving = comp.onFormSubmit();
    const save = await vi.waitFor(() =>
      http.expectOne(`${environment.settingsApiUrl}/demo/browser`)
    );
    expect(save.request.method).toBe('PUT');
    expect(save.request.body).toEqual({
      headless: true,
      browser: ['--no-sandbox', '']
    });
    save.flush({
      ...projectInfo,
      browserSettings: {
        headless: true,
        browser: ['--no-sandbox', '']
      }
    });
    await saving;
    http.verify();
  });
});
