import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { SpecService } from '../../../shared/services/api/spec/spec.service';
import { TagBuildViewComponent } from './tag-build-view.component';

describe('TagBuildViewComponent', () => {
  it.each([false, true])(
    'passes the project slug to the shared page when the project has specs: %s',
    async (hasSpecs) => {
      // @ui is lazy-loaded by the app, so the spec imports it lazily too.
      const { TagBuildPageComponent } = await import('@ui');
      await TestBed.configureTestingModule({
        imports: [TagBuildViewComponent],
        providers: [
          { provide: MatDialog, useValue: { open: vi.fn() } },
          {
            provide: ActivatedRoute,
            useValue: {
              parent: {
                parent: { snapshot: { params: { projectSlug: 'demo-shop' } } }
              }
            }
          },
          {
            provide: SpecService,
            useValue: {
              getProjectSpec: vi.fn(() =>
                of({ specs: hasSpecs ? [{ event: 'login' }] : [] })
              )
            }
          }
        ]
      })
        .overrideComponent(TagBuildPageComponent, {
          set: { imports: [], template: '' }
        })
        .compileComponents();
      const fixture = TestBed.createComponent(TagBuildViewComponent);
      fixture.detectChanges();
      // The page component is imported lazily; wait for it before looking.
      await fixture.componentInstance.tagBuildPageComponent;
      await fixture.whenStable();
      fixture.detectChanges();

      const page = fixture.debugElement
        .query(By.directive(TagBuildPageComponent))
        .injector.get(TagBuildPageComponent);
      expect(page.projectSlug()).toBe('demo-shop');
    }
  );
});
