import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GTMConfiguration } from '@utils';
import { ConversionSuccessDialogComponent } from './conversion-success-dialog.component';

// The dialog reads only the tag, trigger and variable lists of the container
// the converter built.
const payload = {
  exportFormatVersion: 2,
  exportTime: '2026-10-22 10:00:00',
  containerVersion: {
    tag: [
      { name: 'GA4 event - add_to_cart' },
      { name: 'GA4 event - purchase' }
    ],
    trigger: [{ name: 'event equals add_to_cart' }],
    variable: [
      { name: 'DLV - value' },
      { name: 'DLV - currency' },
      { name: 'DLV - items' }
    ]
  }
} as unknown as GTMConfiguration;

type Globals = { dataLayer?: Array<Record<string, unknown>> };

function stubDownload(): ReturnType<typeof vi.spyOn> {
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  const realCreateElement = document.createElement.bind(document);
  const anchor = realCreateElement('a') as HTMLAnchorElement;
  anchor.click = vi.fn();
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) =>
    tag === 'a' ? anchor : realCreateElement(tag)
  );
  return vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
}

function stubClipboard(writeText: () => Promise<void>): void {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value: { writeText }
  });
}

describe('ConversionSuccessDialogComponent', () => {
  afterEach(() => {
    delete (globalThis as Globals).dataLayer;
    vi.restoreAllMocks();
  });

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
    const createObjectURL = stubDownload();

    const fixture = TestBed.createComponent(ConversionSuccessDialogComponent);
    fixture.componentInstance.onDownload();

    expect(createObjectURL).toHaveBeenCalledOnce();
  });

  it('writes the payload as JSON when copying to clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    const fixture = TestBed.createComponent(ConversionSuccessDialogComponent);
    fixture.componentInstance.onClipBoard();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(writeText).toHaveBeenCalledWith(JSON.stringify(payload, null, 2));
  });

  it('pushes container_download with the container size', () => {
    const dataLayer: Array<Record<string, unknown>> = [];
    (globalThis as Globals).dataLayer = dataLayer;
    stubDownload();

    TestBed.createComponent(
      ConversionSuccessDialogComponent
    ).componentInstance.onDownload();

    expect(dataLayer).toEqual([
      {
        event: 'container_download',
        tag_count: 2,
        trigger_count: 1,
        variable_count: 3
      }
    ]);
  });

  it('pushes container_copy only after the copy succeeds', async () => {
    const dataLayer: Array<Record<string, unknown>> = [];
    (globalThis as Globals).dataLayer = dataLayer;
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const component = TestBed.createComponent(
      ConversionSuccessDialogComponent
    ).componentInstance;

    stubClipboard(() => Promise.reject(new Error('denied')));
    component.onClipBoard();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(dataLayer).toEqual([]);

    stubClipboard(() => Promise.resolve());
    component.onClipBoard();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(dataLayer).toEqual([
      {
        event: 'container_copy',
        tag_count: 2,
        trigger_count: 1,
        variable_count: 3
      }
    ]);
  });

  it('pushes nothing where the page has no dataLayer', () => {
    stubDownload();

    expect(() =>
      TestBed.createComponent(
        ConversionSuccessDialogComponent
      ).componentInstance.onDownload()
    ).not.toThrow();
  });
});
