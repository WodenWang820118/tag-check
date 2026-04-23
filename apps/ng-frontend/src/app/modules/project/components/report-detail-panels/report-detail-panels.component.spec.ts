import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataLayerSpec, ItemDef } from '@utils';
import { ReportDetailRouteContext } from '../report-detail.contracts';
import { ReportDetailPanelsComponent } from './report-detail-panels.component';
import { ReportDetailPanelsFacadeService } from './report-detail-panels-facade.service';

function createContext(eventName = 'purchase'): ReportDetailRouteContext {
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
    projectSlug: 'storybook-project',
    eventId: `evt-${eventName}`,
    spec,
    recording: {
      title: `${eventName} recording`,
      steps: []
    },
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
    imageBlob: undefined,
    fileReports: [],
    historyLinkCommands: ['..', 'buckets']
  };
}

describe('ReportDetailPanelsComponent', () => {
  const itemDefStreams: Record<string, Subject<ItemDef | null>> = {};
  const facade = {
    readFile: vi.fn(),
    updateSpec: vi.fn(),
    updateRecording: vi.fn(),
    getItemDefById: vi.fn((itemId: string) => {
      if (!itemDefStreams[itemId]) {
        itemDefStreams[itemId] = new Subject<ItemDef | null>();
      }

      return itemDefStreams[itemId].asObservable();
    }),
    updateItemDef: vi.fn()
  };

  beforeEach(async () => {
    Object.keys(itemDefStreams).forEach((key) => delete itemDefStreams[key]);
    facade.readFile.mockReset();
    facade.updateSpec.mockReset();
    facade.updateRecording.mockReset();
    facade.getItemDefById.mockClear();
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

  it('keeps only the latest item-definition load result when the spec changes', () => {
    const fixture = TestBed.createComponent(ReportDetailPanelsComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('context', createContext('purchase'));
    fixture.detectChanges();
    fixture.componentRef.setInput('context', createContext('signup'));
    fixture.detectChanges();

    itemDefStreams['purchase'].next({
      itemId: 'purchase',
      templateName: 'purchase-template',
      fullItemDef: {
        item_name: 'Socks'
      }
    });
    itemDefStreams['signup'].next({
      itemId: 'signup',
      templateName: 'signup-template',
      fullItemDef: {
        item_name: 'Hat'
      }
    });

    expect(component.itemDefContent()?.itemId).toBe('signup');
    expect(facade.getItemDefById).toHaveBeenCalledWith('purchase');
    expect(facade.getItemDefById).toHaveBeenCalledWith('signup');
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

    expect(facade.updateSpec).toHaveBeenCalledWith('storybook-project', 'evt-purchase', {
      event: 'signup',
      dataLayerSpec: {
        event: 'signup'
      }
    });
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

  it('saves item-definition edits with the explicit item id and payload', () => {
    const fixture = TestBed.createComponent(ReportDetailPanelsComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('context', createContext('purchase'));
    fixture.detectChanges();

    component.itemDefEditMode.set(true);
    component.editItemId.set('purchase');
    component.editTemplateName.set('purchase-template');
    component.itemDefDraftText.set('{"item_name":"Socks"}');
    component.itemDefSyntaxError.set(false);
    component.saveItemDef();

    expect(facade.updateItemDef).toHaveBeenCalledWith('purchase', {
      fullItemDef: {
        item_name: 'Socks'
      },
      templateName: 'purchase-template'
    });
    expect(component.itemDefContent()).toEqual({
      itemId: 'purchase',
      templateName: 'purchase-template',
      fullItemDef: {
        item_name: 'Socks'
      }
    });
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

    facade.readFile.mockResolvedValue('{"title":"Uploaded recording","steps":[]}');

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
    component.onRecordingDraftChange('{"title":"Updated recording","steps":[]}');
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
