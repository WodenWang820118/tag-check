import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { VideoDialogComponent } from './video-dialog.component';

describe('VideoDialogComponent', () => {
  const originalCreate = (URL as any).createObjectURL;
  const originalRevoke = (URL as any).revokeObjectURL;

  beforeEach(() => {
    (URL as any).createObjectURL = vi.fn(() => 'blob:url');
    (URL as any).revokeObjectURL = vi.fn();
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
        { provide: MatDialogRef, useValue: {} }
      ]
    });
    return TestBed.createComponent(VideoDialogComponent);
  }

  it('plays the blob through its object URL', () => {
    const blob = new Blob(['v']);
    const fixture = configure(blob);
    fixture.detectChanges();
    expect((URL as any).createObjectURL).toHaveBeenCalledWith(blob);
    expect(fixture.componentInstance.url).toBe('blob:url');
    const source: HTMLSourceElement =
      fixture.nativeElement.querySelector('source');
    expect(source.src).toBe('blob:url');
  });

  it('revokes the object URL on destroy', () => {
    const fixture = configure(new Blob(['v']));
    fixture.destroy();
    expect((URL as any).revokeObjectURL).toHaveBeenCalledWith('blob:url');
  });
});
