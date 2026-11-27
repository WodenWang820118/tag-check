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
import { ProjectInfoFormComponent } from './project-info-form.component';

describe('ProjectInfoFormComponent', () => {
  it('loads project info from route and updates it on submit', async () => {
    const projectInfo = {
      projectSlug: 'demo',
      projectName: 'Demo Site',
      measurementId: 'G-11111',
      projectDescription: 'Initial description'
    };
    await TestBed.configureTestingModule({
      imports: [ProjectInfoFormComponent],
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
    const fixture = TestBed.createComponent(ProjectInfoFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.f.projectName().value()).toBe('Demo Site');
    expect(comp.f.measurementId().value()).toBe('G-11111');
    expect(comp.f.projectDescription().value()).toBe('Initial description');

    comp.f.projectName().value.set('Updated Site');
    comp.f.measurementId().value.set('G-22222');
    comp.f.projectDescription().value.set('Updated description');

    const saving = comp.onSubmit();
    const save = await vi.waitFor(() =>
      http.expectOne(`${environment.settingsApiUrl}/demo/project`)
    );
    expect(save.request.method).toBe('PUT');
    expect(save.request.body).toEqual({
      projectName: 'Updated Site',
      measurementId: 'G-22222',
      projectDescription: 'Updated description'
    });
    save.flush({
      ...projectInfo,
      projectName: 'Updated Site',
      measurementId: 'G-22222',
      projectDescription: 'Updated description'
    });
    await saving;
    http.verify();
  });
});
