import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataLayerSpec, ItemDef } from '@utils';
import { ReportDetailRouteContext } from '../report-detail.contracts';
import { ReportDetailPanelsComponent } from './report-detail-panels.component';
import { ReportDetailPanelsFacadeService } from './report-detail-panels-facade.service';

function createContext(
  eventName = 'purchase',
  projectSlug = 'storybook-project'
): ReportDetailRouteContext {
  const spec: DataLayerSpec = {
    eventName,
    dataLayerSpec: {
      event: eventName
    } as DataLayerSpec['dataLayerSpec'],
    rawGtmTag: {
      tag: {
        name: `${eventName}-tag`
      } as DataLayerSpec['rawGtmTag']['tag'],
      trigger: []
    }
  };

  return {
    projectSlug,
    eventId: `evt-${eventName}`,
    spec,
    recording: {
      title: `${eventName} recording`,
      steps: []
    },
    run: null,
    runs: [],
    isLatestRun: true,
    stepFailure: null,
    reportDetails: {
      position: 0,
      event: eventName,
      eventId: `evt-${eventName}`,
      eventName,
      passed: false,
      requestPassed: false,
      destinationUrl: 'https://example.com',
      createdAt: new Date('2026-04-23T12:34:56.000Z'),
      updatedAt: new Date('2026-04-23T12:34:56.000Z')
    } as ReportDetailRouteContext['reportDetails'],
    videoBlob: undefined,
    tagAssistantVideoBlob: undefined,
    imageBlob: undefined,
    historyLinkCommands: ['..', 'buckets']
  };
}

/** The JSON PUT /specs/:projectSlug/:eventId/item-def returns. */
function savedItemDefJson(json: string): ItemDef {
  return JSON.parse(json);
}

describe('ReportDetailPanelsComponent', () => {
  const itemDefStreams: Record<string, Subject<ItemDef | null>> = {};
  const facade = {
    readFile: vi.fn(),
    updateSpec: vi.fn(),
    updateRecording: vi.fn(),
    getItemDef: vi.fn((projectSlug: string, eventId: string) => {
      const key = `${projectSlug}/${eventId}`;
      if (!itemDefStreams[key]) {
        itemDefStreams[key] = new Subject<ItemDef | null>();
      }

      return itemDefStreams[key].asObservable();
    }),
    updateItemDef: vi.fn()
  };

  beforeEach(async () => {
    Object.keys(itemDefStreams).forEach((key) => delete itemDefStreams[key]);
    facade.readFile.mockReset();
    facade.updateSpec.mockReset();
    facade.updateRecording.mockReset();
    facade.getItemDef.mockClear();
    facade.updateItemDef.mockReset();
    facade.updateSpec.mockReturnValue(of({}));
    facade.updateRecording.mockReturnValue(of({ title: 'saved', steps: [] }));
    facade.updateItemDef.mockReturnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [ReportDetailPanelsComponent]
    })
      .overrideComponent(ReportDetailPanelsComponent, {
        remove: {
          providers: [ReportDetailPanelsFacadeService]
        },
        add: {
          providers: [
            {
              provide: ReportDetailPanelsFacadeService,
              useValue: facade
            }
          ]
        }
      })
      .compileComponents();
  });

  it('keeps only the latest item-definition load result when the test changes', () => {
    const fixture = TestBed.createComponent(ReportDetailPanelsComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('context', createContext('purchase'));
    fixture.detectChanges();
    fixture.componentRef.setInput('context', createContext('signup'));
    fixture.detectChanges();

    itemDefStreams['storybook-project/evt-purchase'].next({
      itemId: 'purchase',
      templateName: 'purchase-template',
      fullItemDef: {
        item_name: 'Socks'
      }
    });
    itemDefStreams['storybook-project/evt-signup'].next({
      itemId: 'signup',
      templateName: 'signup-template',
      fullItemDef: {
        item_name: 'Hat'
      }
    });

    expect(component.itemDefContent()?.itemId).toBe('signup');
    expect(facade.getItemDef).toHaveBeenCalledWith(
      'storybook-project',
      'evt-purchase'
    );
    expect(facade.getItemDef).toHaveBeenCalledWith(
      'storybook-project',
      'evt-signup'
    );
  });

  it("loads the definition of the test's own project, not by event name", () => {
    const fixture = TestBed.createComponent(ReportDetailPanelsComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput(
      'context',
      createContext('purchase', 'shop_a')
    );
    fixture.detectChanges();
    fixture.componentRef.setInput(
      'context',
      createContext('purchase', 'shop_b')
    );
    fixture.detectChanges();
    itemDefStreams['shop_b/evt-purchase'].next(null);

    expect(facade.getItemDef.mock.calls).toEqual([
      ['shop_a', 'evt-purchase'],
      ['shop_b', 'evt-purchase']
    ]);
    expect(component.itemDefContent()).toBeNull();
    expect(component.editItemId()).toBe('purchase');
  });

  it('does not reload the definition when the spec is saved', () => {
    const fixture = TestBed.createComponent(ReportDetailPanelsComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('context', createContext('purchase'));
    fixture.detectChanges();
    component.toggleSpecEdit();
    component.onSpecDraftChange('{"event":"signup"}');
    component.saveSpec();
    fixture.detectChanges();

    expect(facade.getItemDef).toHaveBeenCalledTimes(1);
  });

  it('uses explicit route context when saving a valid spec draft', () => {
    const fixture = TestBed.createComponent(ReportDetailPanelsComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('context', createContext('purchase'));
    fixture.detectChanges();

    component.toggleSpecEdit();
    component.onSpecDraftChange(
      JSON.stringify(
        {
          event: 'signup'
        },
        null,
        2
      )
    );
    component.specSyntaxError.set(false);
    component.saveSpec();

    expect(facade.updateSpec).toHaveBeenCalledWith(
      'storybook-project',
      'evt-purchase',
      {
        event: 'signup',
        dataLayerSpec: {
          event: 'signup'
        }
      }
    );
    expect(component.specContent()?.dataLayerSpec.event).toBe('signup');
    expect(component.specEditMode()).toBe(false);
  });

  it('resets spec draft content when canceling an edit', () => {
    const fixture = TestBed.createComponent(ReportDetailPanelsComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('context', createContext('purchase'));
    fixture.detectChanges();

    component.toggleSpecEdit();
    component.onSpecDraftChange('{"event":"tampered"}');
    component.cancelSpecEdit();

    expect(component.specEditMode()).toBe(false);
    expect(component.specDraftText()).toContain('"event": "purchase"');
  });

  it('blocks item-definition save when no item id is available', () => {
    const fixture = TestBed.createComponent(ReportDetailPanelsComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('context', createContext('purchase'));
    fixture.detectChanges();

    component.itemDefEditMode.set(true);
    component.itemDefDraftText.set('{"item_name":"Socks"}');
    component.itemDefSyntaxError.set(false);
    component.editItemId.set('');
    component.saveItemDef();

    expect(component.itemDefPanelState().canSave).toBe(false);
    expect(facade.updateItemDef).not.toHaveBeenCalled();
  });

  it("saves item-definition edits to the test's own route", () => {
    const fixture = TestBed.createComponent(ReportDetailPanelsComponent);
    const component = fixture.componentInstance;
    facade.updateItemDef.mockReturnValue(
      of(
        savedItemDefJson(
          '{"itemId":"purchase","templateName":"purchase-template","fullItemDef":{"item_name":"Socks"}}'
        )
      )
    );

    fixture.componentRef.setInput('context', createContext('purchase'));
    fixture.detectChanges();

    component.itemDefEditMode.set(true);
    component.editItemId.set('purchase');
    component.editTemplateName.set('purchase-template');
    component.itemDefDraftText.set('{"item_name":"Socks"}');
    component.itemDefSyntaxError.set(false);
    component.saveItemDef();

    expect(facade.updateItemDef).toHaveBeenCalledWith(
      'storybook-project',
      'evt-purchase',
      {
        itemId: 'purchase',
        fullItemDef: {
          item_name: 'Socks'
        },
        templateName: 'purchase-template'
      }
    );
    expect(component.itemDefContent()).toEqual({
      itemId: 'purchase',
      templateName: 'purchase-template',
      fullItemDef: {
        item_name: 'Socks'
      }
    });
    expect(component.itemDefEditMode()).toBe(false);
  });

  it('creates the definition of a test that has none and shows what was saved', () => {
    const fixture = TestBed.createComponent(ReportDetailPanelsComponent);
    const component = fixture.componentInstance;
    facade.updateItemDef.mockReturnValue(
      of(
        savedItemDefJson(
          '{"itemId":"purchase","templateName":"purchase","fullItemDef":{"item_name":"Hat"}}'
        )
      )
    );

    fixture.componentRef.setInput('context', createContext('purchase'));
    fixture.detectChanges();
    itemDefStreams['storybook-project/evt-purchase'].next(null);

    component.toggleItemDefEdit();
    component.onItemDefDraftChange('{"item_name":"Hat"}');
    component.saveItemDef();

    expect(facade.updateItemDef).toHaveBeenCalledWith(
      'storybook-project',
      'evt-purchase',
      {
        itemId: 'purchase',
        fullItemDef: { item_name: 'Hat' },
        templateName: undefined
      }
    );
    expect(component.itemDefContent()).toEqual({
      itemId: 'purchase',
      templateName: 'purchase',
      fullItemDef: { item_name: 'Hat' }
    });
    expect(component.editTemplateName()).toBe('purchase');
    expect(component.itemDefEditMode()).toBe(false);
  });

  it('loads spec file content into the local draft state', async () => {
    const fixture = TestBed.createComponent(ReportDetailPanelsComponent);
    const component = fixture.componentInstance;
    const target = {
      files: [{} as File],
      value: 'selected'
    } as unknown as HTMLInputElement;

    facade.readFile.mockResolvedValue('{"event":"signup"}');

    await component.onSpecFileSelected({
      target
    } as unknown as Event);

    expect(facade.readFile).toHaveBeenCalled();
    expect(component.specDraftText()).toContain('"signup"');
    expect(component.specSyntaxError()).toBe(false);
    expect(target.value).toBe('');
  });

  it('loads recording file content into the local draft state', async () => {
    const fixture = TestBed.createComponent(ReportDetailPanelsComponent);
    const component = fixture.componentInstance;
    const target = {
      files: [{} as File],
      value: 'selected'
    } as unknown as HTMLInputElement;

    facade.readFile.mockResolvedValue(
      '{"title":"Uploaded recording","steps":[]}'
    );

    await component.onRecordingFileSelected({
      target
    } as unknown as Event);

    expect(component.recordingDraftText()).toContain('"Uploaded recording"');
    expect(component.recordingSyntaxError()).toBe(false);
    expect(target.value).toBe('');
  });

  it('normalizes uploaded item-definition wrapper payloads into the local draft state', async () => {
    const fixture = TestBed.createComponent(ReportDetailPanelsComponent);
    const component = fixture.componentInstance;
    const target = {
      files: [{} as File],
      value: 'selected'
    } as unknown as HTMLInputElement;

    fixture.componentRef.setInput('context', createContext('purchase'));
    fixture.detectChanges();
    facade.readFile.mockResolvedValue(
      '{"itemId":"sku-1","templateName":"template-a","fullItemDef":{"item_name":"Socks"}}'
    );

    await component.onItemDefFileSelected({
      target
    } as unknown as Event);

    expect(component.editItemId()).toBe('sku-1');
    expect(component.editTemplateName()).toBe('template-a');
    expect(component.itemDefDraftText()).toContain('"Socks"');
    expect(component.itemDefSyntaxError()).toBe(false);
    expect(target.value).toBe('');
  });

  it('saves recording edits with the explicit route context', () => {
    const fixture = TestBed.createComponent(ReportDetailPanelsComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('context', createContext('purchase'));
    fixture.detectChanges();

    component.toggleRecordingEdit();
    component.onRecordingDraftChange(
      '{"title":"Updated recording","steps":[]}'
    );
    component.recordingSyntaxError.set(false);
    component.saveRecording();

    expect(facade.updateRecording).toHaveBeenCalledWith(
      'storybook-project',
      'evt-purchase',
      {
        title: 'Updated recording',
        steps: []
      }
    );
    expect(component.recordingContent()).toEqual({
      title: 'Updated recording',
      steps: []
    });
    expect(component.recordingEditMode()).toBe(false);
  });

  it('restores recording draft content when canceling an edit', () => {
    const fixture = TestBed.createComponent(ReportDetailPanelsComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('context', createContext('purchase'));
    fixture.detectChanges();

    component.toggleRecordingEdit();
    component.onRecordingDraftChange('{"title":"Edited recording","steps":[]}');
    component.recordingSyntaxError.set(true);
    component.cancelRecordingEdit();

    expect(component.recordingEditMode()).toBe(false);
    expect(component.recordingDraftText()).toContain('"purchase recording"');
    expect(component.recordingSyntaxError()).toBe(false);
  });

  it('restores item-definition draft state when canceling an edit', () => {
    const fixture = TestBed.createComponent(ReportDetailPanelsComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('context', createContext('purchase'));
    fixture.detectChanges();

    component.itemDefContent.set({
      itemId: 'purchase',
      templateName: 'purchase-template',
      fullItemDef: {
        item_name: 'Original Socks'
      }
    });
    component.itemDefEditMode.set(true);
    component.editItemId.set('overridden-id');
    component.editTemplateName.set('override-template');
    component.itemDefDraftText.set('{"item_name":"Edited"}');
    component.itemDefSyntaxError.set(true);
    component.cancelItemDefEdit();

    expect(component.itemDefEditMode()).toBe(false);
    expect(component.editItemId()).toBe('purchase');
    expect(component.editTemplateName()).toBe('purchase-template');
    expect(component.itemDefDraftText()).toContain('"Original Socks"');
    expect(component.itemDefSyntaxError()).toBe(false);
  });
});
