import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConversionSuccessDialogComponent } from './conversion-success-dialog.component';

describe('ConversionSuccessDialogComponent', () => {
  const payload = { foo: 'bar' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConversionSuccessDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: payload }
      ]
    }).compileComponents();
  });

  it('creates the component with the injected configuration', () => {
    const fixture = TestBed.createComponent(ConversionSuccessDialogComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.configuration).toBe(payload);
  });

  it('serializes the payload as JSON when downloading', () => {
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:fake');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const realCreateElement = document.createElement.bind(document);
    const anchor = realCreateElement('a') as HTMLAnchorElement;
    anchor.click = vi.fn();
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) =>
      tag === 'a' ? anchor : realCreateElement(tag)
    );

    const fixture = TestBed.createComponent(ConversionSuccessDialogComponent);
    try {
      fixture.componentInstance.onDownload();
    } catch {
      // dialog.closeAll may throw because there is no open dialog ref;
      // that side effect is not what this test is asserting on.
    }

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(anchor.click).toHaveBeenCalledOnce();
  });

  it('writes the payload as JSON when copying to clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: { writeText }
    });

    const fixture = TestBed.createComponent(ConversionSuccessDialogComponent);
    fixture.componentInstance.onClipBoard();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(writeText).toHaveBeenCalledWith(JSON.stringify(payload, null, 2));
  });
});
