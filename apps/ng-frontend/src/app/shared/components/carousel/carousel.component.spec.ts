import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { CarouselComponent } from './carousel.component';

describe('CarouselComponent', () => {
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  let created = 0;

  beforeEach(() => {
    created = 0;
    URL.createObjectURL = vi.fn(() => `blob:media-${++created}`);
    URL.revokeObjectURL = vi.fn();
    TestBed.configureTestingModule({
      imports: [CarouselComponent],
      providers: [{ provide: MatDialog, useValue: { open: vi.fn() } }]
    });
  });

  afterEach(() => {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  });

  it('points the screenshot and the recording at their blob URLs', () => {
    const fixture = TestBed.createComponent(CarouselComponent);
    fixture.componentRef.setInput('imageBlob', new Blob(['png']));
    fixture.componentRef.setInput('videoBlob', new Blob(['webm']));
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('img')?.getAttribute('src')).toBe(
      'blob:media-1'
    );
    expect(element.querySelector('video source')?.getAttribute('src')).toBe(
      'blob:media-2'
    );
  });

  it('revokes the blob URLs on destroy', () => {
    const fixture = TestBed.createComponent(CarouselComponent);
    fixture.componentRef.setInput('imageBlob', new Blob(['png']));
    fixture.detectChanges();
    fixture.destroy();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:media-1');
  });
});
