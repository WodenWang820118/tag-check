import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { UploadCardComponent } from './upload-card.component';
import {
  UploadCardFacadeService,
  UploadState
} from './upload-card-facade.service';

describe('UploadCardComponent', () => {
  function render(state: UploadState) {
    const facade = {
      state: signal<UploadState>(state),
      onFileSelected: vi.fn().mockResolvedValue(undefined)
    };
    TestBed.configureTestingModule({
      imports: [UploadCardComponent],
      providers: [
        { provide: UploadCardFacadeService, useValue: facade },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ projectSlug: 'shop' }),
            snapshot: { params: { projectSlug: 'shop' } }
          }
        }
      ]
    });
    const fixture = TestBed.createComponent(UploadCardComponent);
    fixture.detectChanges();
    return { fixture, facade };
  }

  it("passes the selected file to the facade with the route's project", () => {
    const { fixture, facade } = render({ status: 'idle' });
    const event = new Event('change');

    fixture.componentInstance.onFileSelected(event);

    expect(facade.onFileSelected).toHaveBeenCalledWith('shop', event);
  });

  it('disables the upload button while a file uploads', () => {
    const { fixture } = render({ status: 'uploading', fileName: 'gtm.json' });
    const button: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="import-gtm-upload"]'
    );

    expect(fixture.componentInstance.uploadingFileName()).toBe('gtm.json');
    expect(button.disabled).toBe(true);
  });

  it('shows the error message of a failed import', () => {
    const { fixture } = render({
      status: 'error',
      message: 'Not a GTM export'
    });

    expect(fixture.componentInstance.errorMessage()).toBe('Not a GTM export');
    expect(fixture.componentInstance.summary()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Not a GTM export');
  });
});
