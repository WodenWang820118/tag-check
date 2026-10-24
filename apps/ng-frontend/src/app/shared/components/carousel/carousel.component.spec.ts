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

  it('adds the Tag Assistant recording after the site recording, both labelled', () => {
    const tagAssistant = new Blob(['ta-webm']);
    const fixture = TestBed.createComponent(CarouselComponent);
    fixture.componentRef.setInput('imageBlob', new Blob(['png']));
    fixture.componentRef.setInput('videoBlob', new Blob(['webm']));
    fixture.componentRef.setInput('tagAssistantVideoBlob', tagAssistant);
    fixture.detectChanges();
    // The component provides its own MatDialog through MatDialogModule.
    const open = vi
      .spyOn(fixture.debugElement.injector.get(MatDialog), 'open')
      .mockReturnValue({} as never);

    const element: HTMLElement = fixture.nativeElement;
    const captions = Array.from(
      element.querySelectorAll('.carousel-caption'),
      (caption) => caption.textContent?.trim()
    );
    expect(captions).toEqual(['Website', 'Tag Assistant']);
    element
      .querySelector<HTMLElement>('[data-testid="media-open-tag-assistant"]')
      ?.click();
    expect(open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        data: expect.objectContaining({
          blob: tagAssistant,
          url: 'blob:media-3'
        })
      })
    );
  });

  it('leaves out an empty Tag Assistant recording and the site label', () => {
    const fixture = TestBed.createComponent(CarouselComponent);
    fixture.componentRef.setInput('videoBlob', new Blob(['webm']));
    fixture.componentRef.setInput('tagAssistantVideoBlob', new Blob([]));
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelectorAll('video')).toHaveLength(1);
    expect(element.querySelector('.carousel-caption')).toBeNull();
  });

  it('revokes the blob URLs on destroy', () => {
    const fixture = TestBed.createComponent(CarouselComponent);
    fixture.componentRef.setInput('imageBlob', new Blob(['png']));
    fixture.detectChanges();
    fixture.destroy();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:media-1');
  });
});
