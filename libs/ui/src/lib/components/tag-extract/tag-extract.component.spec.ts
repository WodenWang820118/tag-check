import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EditorFacadeService,
  TagBuildMode,
  TagBuildModeService
} from '@data-access';
import { TagExtractComponent } from './tag-extract.component';

// A container export as Tag Manager writes it, trimmed to what extraction
// reads: two GA4 event tags, one of them paused.
const ids = { accountId: '1', containerId: '2' };
const eventTag = (name: string, eventName: string, paused = false) => ({
  ...ids,
  name,
  type: 'gaawe',
  ...(paused ? { paused: true } : {}),
  parameter: [
    { type: 'TEMPLATE', key: 'eventName', value: eventName },
    {
      type: 'LIST',
      key: 'eventSettingsTable',
      list: [
        {
          type: 'MAP',
          map: [
            { type: 'TEMPLATE', key: 'parameter', value: 'value' },
            {
              type: 'TEMPLATE',
              key: 'parameterValue',
              value: '{{DLV - value}}'
            }
          ]
        },
        {
          type: 'MAP',
          map: [
            { type: 'TEMPLATE', key: 'parameter', value: 'items' },
            {
              type: 'TEMPLATE',
              key: 'parameterValue',
              value: '{{DLV - items}}'
            }
          ]
        }
      ]
    }
  ]
});
const dataLayerVariable = (name: string, path: string) => ({
  ...ids,
  name,
  type: 'v',
  parameter: [
    { type: 'INTEGER', key: 'dataLayerVersion', value: '2' },
    { type: 'TEMPLATE', key: 'name', value: path }
  ]
});
const containerExport = JSON.stringify({
  exportFormatVersion: 2,
  exportTime: '2026-10-26 10:00:00',
  containerVersion: {
    tag: [
      eventTag('GA4 event - add_to_cart', 'add_to_cart'),
      eventTag('GA4 event - old', 'old_event', true)
    ],
    trigger: [],
    variable: [
      dataLayerVariable('DLV - value', 'ecommerce.value'),
      dataLayerVariable('DLV - items', 'ecommerce.items')
    ]
  }
});

type Globals = { dataLayer?: Array<Record<string, unknown>> };

describe('TagExtractComponent', () => {
  let fixture: ComponentFixture<TagExtractComponent>;
  let element: HTMLElement;
  const editorFacade = { inputJsonContent: undefined as unknown };

  beforeEach(async () => {
    editorFacade.inputJsonContent = undefined;
    await TestBed.configureTestingModule({
      imports: [TagExtractComponent],
      providers: [
        provideNoopAnimations(),
        { provide: EditorFacadeService, useValue: editorFacade }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(TagExtractComponent);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    delete (globalThis as Globals).dataLayer;
    vi.restoreAllMocks();
  });

  const byTestId = (id: string) =>
    element.querySelector<HTMLElement>(`[data-testid="${id}"]`);

  async function upload(text: string, name = 'GTM-TEST.json') {
    const input = byTestId('tagextract-file') as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [new File([text], name, { type: 'application/json' })]
    });
    await fixture.componentInstance.onFileSelected({
      target: input
    } as unknown as Event);
    fixture.detectChanges();
  }

  it('lists the plan and what was left out of an uploaded container', async () => {
    const dataLayer: Array<Record<string, unknown>> = [];
    (globalThis as Globals).dataLayer = dataLayer;

    await upload(containerExport);

    expect(byTestId('tagextract-summary')?.textContent).toMatch(
      /1\s+event\s+from\s+2\s+GA4 event\s+tags/
    );
    const row = byTestId('tagextract-row-add_to_cart');
    expect(
      [...(row?.querySelectorAll('td') ?? [])]
        .slice(0, 3)
        .map((cell) => cell.textContent?.trim())
    ).toEqual(['add_to_cart', 'value', 'item_id, item_name']);
    expect(byTestId('tagextract-skipped')?.textContent).toContain(
      'Tag "GA4 event - old": paused.'
    );
    expect(dataLayer).toEqual([
      { event: 'plan_extract', event_count: 1, skipped_count: 1 }
    ]);
  });

  it('explains why a file is not a container export', async () => {
    await upload('{"tag": []}', 'specs.json');

    expect(byTestId('tagextract-error')?.textContent?.trim()).toBe(
      'The file is not a Tag Manager container export: containerVersion is missing.'
    );
    expect(byTestId('tagextract-table')).toBeNull();
  });

  it('downloads the plan as CSV', async () => {
    await upload(containerExport);
    let csv = '';
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      void (blob as Blob).text().then((text) => (csv = text));
      return 'blob:fake';
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    byTestId('tagextract-download')?.click();
    await vi.waitFor(() => expect(csv).not.toBe(''));

    expect(click).toHaveBeenCalledOnce();
    expect(csv.split('\r\n')[0]).toBe(
      'event_name,event_parameters,item_parameters,notes'
    );
    expect(csv).toContain('add_to_cart,value,"item_id, item_name",');
  });

  it("opens the plan's specs in Tag Build", async () => {
    await upload(containerExport);
    const mode = TestBed.inject(TagBuildModeService);
    mode.setMode(TagBuildMode.TagExtract);

    byTestId('tagextract-open-in-build')?.click();

    expect(editorFacade.inputJsonContent).toEqual([
      {
        event: 'add_to_cart',
        ecommerce: {
          value: '$value',
          items: [{ item_id: '$item_id', item_name: '$item_name' }]
        }
      }
    ]);
    expect(mode.mode).toBe(TagBuildMode.TagBuild);
  });
});
