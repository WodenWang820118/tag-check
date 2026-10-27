import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GTMConfiguration } from '@utils';
import { EditorFacadeService, EditorService } from '@data-access';
import {
  ConversionSuccessDialogComponent,
  type ConversionSuccessDialogData
} from './conversion-success-dialog.component';

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

function stubDownload() {
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  const realCreateElement = document.createElement.bind(document);
  const anchor = realCreateElement('a') as HTMLAnchorElement;
  anchor.click = vi.fn();
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) =>
    tag === 'a' ? anchor : realCreateElement(tag)
  );
  const createObjectURL = vi
    .spyOn(URL, 'createObjectURL')
    .mockReturnValue('blob:fake');
  return { anchor, createObjectURL };
}

function stubClipboard(writeText: () => Promise<void>): void {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value: { writeText }
  });
}

describe('ConversionSuccessDialogComponent', () => {
  let editorFacade: EditorFacadeService;
  let editor: EditorService;
  let dialogData: ConversionSuccessDialogData;

  afterEach(() => {
    editor.editor$.inputJson().destroy();
    editor.editor$.outputJson().destroy();
    delete (globalThis as Globals).dataLayer;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    dialogData = { configuration: payload };
    await TestBed.configureTestingModule({
      imports: [ConversionSuccessDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: dialogData }
      ]
    }).compileComponents();
    editor = TestBed.inject(EditorService);
    editorFacade = TestBed.inject(EditorFacadeService);
    editorFacade.inputJsonContent = [{ event: 'purchase' }];
    editorFacade.outputJsonContent = payload;
  });

  it('creates the component with the injected configuration', () => {
    const fixture = TestBed.createComponent(ConversionSuccessDialogComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.configuration).toBe(payload);
  });

  it('serializes the payload as JSON when downloading', () => {
    const { createObjectURL } = stubDownload();

    const fixture = TestBed.createComponent(ConversionSuccessDialogComponent);
    fixture.componentInstance.onDownload();

    expect(createObjectURL).toHaveBeenCalledOnce();
  });

  it('downloads the current conversion after a previous result was replaced', async () => {
    const { createObjectURL } = stubDownload();
    const previousDialog = TestBed.createComponent(
      ConversionSuccessDialogComponent
    ).componentInstance;
    editorFacade.inputJsonContent = [{ event: 'login' }];
    const current = { ...payload, exportTime: '2026-10-28 12:00:00' };
    editorFacade.outputJsonContent = current;
    previousDialog.onDownload();

    expect(createObjectURL).not.toHaveBeenCalled();
    dialogData.configuration = current;
    const currentDialog = TestBed.createComponent(
      ConversionSuccessDialogComponent
    ).componentInstance;
    currentDialog.onDownload();

    const blob = createObjectURL.mock.calls[0]?.[0];
    expect(blob).toBeInstanceOf(Blob);
    if (!(blob instanceof Blob)) {
      throw new Error('Expected a JSON download');
    }
    expect(JSON.parse(await blob.text())).toEqual(current);
  });

  it('blocks download and copy after input replacement invalidates the result', () => {
    const { createObjectURL } = stubDownload();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    const fixture = TestBed.createComponent(ConversionSuccessDialogComponent);
    fixture.detectChanges();

    editorFacade.inputJsonContent = [{ event: 'login' }];
    fixture.detectChanges();
    fixture.componentInstance.onDownload();
    fixture.componentInstance.onClipBoard();

    expect(createObjectURL).not.toHaveBeenCalled();
    expect(writeText).not.toHaveBeenCalled();
    const element: HTMLElement = fixture.nativeElement;
    expect(
      element.querySelector<HTMLButtonElement>(
        '[data-testid="tagbuild-download"]'
      )?.disabled
    ).toBe(true);
    expect(
      element.querySelector<HTMLButtonElement>('[data-testid="tagbuild-copy"]')
        ?.disabled
    ).toBe(true);
  });

  it.each([
    [undefined, 'gtm-container-2026-10-28.json'],
    ['demo-shop', 'demo-shop-gtm-container-2026-10-28.json']
  ])('names the download for project %s', (projectSlug, filename) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    // Half past midnight local time: a UTC date would still be the 27th
    // east of UTC.
    vi.setSystemTime(new Date(2026, 9, 28, 0, 30));
    dialogData.projectSlug = projectSlug;
    const { anchor } = stubDownload();

    TestBed.createComponent(
      ConversionSuccessDialogComponent
    ).componentInstance.onDownload();

    expect(anchor.download).toBe(filename);
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
