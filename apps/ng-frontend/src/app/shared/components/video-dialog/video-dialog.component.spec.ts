import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { VideoDialogComponent } from './video-dialog.component';

describe('VideoDialogComponent', () => {
  const originalCreate = (URL as any).createObjectURL;
  const originalRevoke = (URL as any).revokeObjectURL;
  const sanitizer = {
    bypassSecurityTrustUrl: vi.fn((u: string) => `safe:${u}`)
  };

  beforeEach(() => {
    (URL as any).createObjectURL = vi.fn(() => 'blob:url');
    (URL as any).revokeObjectURL = vi.fn();
    sanitizer.bypassSecurityTrustUrl.mockClear();
  });

  afterEach(() => {
    (URL as any).createObjectURL = originalCreate;
    (URL as any).revokeObjectURL = originalRevoke;
  });

  function configure(blob: Blob) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [VideoDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { blob } },
        { provide: MatDialogRef, useValue: {} },
        { provide: DomSanitizer, useValue: sanitizer }
      ]
    });
    return TestBed.createComponent(VideoDialogComponent);
  }

  it('creates a sanitized object URL from the blob', () => {
    const blob = new Blob(['v']);
    const fixture = configure(blob);
    expect((URL as any).createObjectURL).toHaveBeenCalledWith(blob);
    expect(sanitizer.bypassSecurityTrustUrl).toHaveBeenCalledWith('blob:url');
    expect(fixture.componentInstance.safeUrl).toBe('safe:blob:url');
  });

  it('revokes the object URL on destroy', () => {
    const fixture = configure(new Blob(['v']));
    fixture.destroy();
    expect((URL as any).revokeObjectURL).toHaveBeenCalledWith('blob:url');
  });
});
