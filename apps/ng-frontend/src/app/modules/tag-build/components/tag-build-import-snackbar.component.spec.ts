import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarRef
} from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { TagBuildImportSnackbarComponent } from './tag-build-import-snackbar.component';

describe('TagBuildImportSnackbarComponent', () => {
  it('links the import result to the Tests page', () => {
    const dismiss = vi.fn();
    TestBed.configureTestingModule({
      imports: [TagBuildImportSnackbarComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        {
          provide: MAT_SNACK_BAR_DATA,
          useValue: {
            message:
              'Created 2 · Updated 1 · Renamed 0 · Kept both 2 · Unchanged 1 · Skipped 1',
            testsLink: '/projects/demo-shop'
          }
        },
        {
          provide: MatSnackBarRef,
          useValue: { dismiss, dismissWithAction: vi.fn() }
        }
      ]
    });
    const fixture = TestBed.createComponent(TagBuildImportSnackbarComponent);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a');
    if (!(link instanceof HTMLAnchorElement)) {
      throw new Error('expected the Tests link');
    }

    expect(link.textContent?.trim()).toBe('Tests');
    expect(link.getAttribute('href')).toBe('/projects/demo-shop');
    expect(link.dataset['testid']).toBe('tagbuild-import-tests');

    const close = fixture.nativeElement.querySelector('button');
    if (!(close instanceof HTMLButtonElement)) {
      throw new Error('expected the close button');
    }
    close.click();
    expect(dismiss).toHaveBeenCalledOnce();
  });
});
