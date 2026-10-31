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
import { AuthenticationFormComponent } from './authentication-form.component';

describe('AuthenticationFormComponent', () => {
  it('loads authentication settings from route and updates them on submit', async () => {
    const projectInfo = {
      projectSlug: 'demo',
      projectName: 'Demo',
      authenticationSettings: {
        username: 'admin',
        password: 'pw'
      }
    };
    await TestBed.configureTestingModule({
      imports: [AuthenticationFormComponent],
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
    const fixture = TestBed.createComponent(AuthenticationFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.f.username().value()).toBe('admin');
    expect(comp.f.password().value()).toBe('pw');

    comp.f.username().value.set('new-admin');
    comp.f.password().value.set('pw2');
    const saving = comp.onSubmit();
    const save = await vi.waitFor(() =>
      http.expectOne(`${environment.settingsApiUrl}/demo/authentication`)
    );
    expect(save.request.method).toBe('PUT');
    expect(save.request.body).toEqual({
      username: 'new-admin',
      password: 'pw2'
    });
    save.flush({
      ...projectInfo,
      authenticationSettings: {
        username: 'new-admin',
        password: 'pw2'
      }
    });
    await saving;
    http.verify();
  });

  it('toggles password visibility', async () => {
    await TestBed.configureTestingModule({
      imports: [AuthenticationFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: MatSnackBar, useValue: { openFromComponent: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({}),
            parent: { params: of({ projectSlug: 'demo' }) }
          }
        }
      ]
    }).compileComponents();
    const fixture = TestBed.createComponent(AuthenticationFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.showPassword()).toBe(false);
    comp.showPassword.set(true);
    expect(comp.showPassword()).toBe(true);
  });
});
