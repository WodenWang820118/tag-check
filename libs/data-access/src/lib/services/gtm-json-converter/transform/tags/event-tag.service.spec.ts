import { TestBed } from '@angular/core/testing';
import { getGa4EventParameterRows, TagTypeEnum } from '@utils';

import { EventTag } from './event-tag.service';

const triggers = [
  { name: 'page_view', triggerId: '10' },
  { name: 'click', triggerId: '20' },
  { name: 'click', triggerId: '21' }
] as never;

const tag = {
  name: 'purchase',
  triggers: [{ name: 'click' }, { name: 'page_view' }],
  parameters: [
    { type: 'TEMPLATE', key: 'currency', value: 'USD' },
    { type: 'TEMPLATE', key: 'items', value: 'ecommerce.items' }
  ]
} as never;

describe('EventTag', () => {
  let service: EventTag;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventTag);
  });

  it('produces a GAAWE config with name "GA4 event - <tag>"', () => {
    const config = service.createTag(
      'GA4',
      'acc',
      'cnt',
      tag,
      triggers,
      'false'
    );
    expect(config.name).toBe('GA4 event - purchase');
    expect(config.type).toBe(TagTypeEnum.GAAWE);
    expect(config.accountId).toBe('acc');
    expect(config.containerId).toBe('cnt');
    expect(config.tagFiringOption).toBe('ONCE_PER_EVENT');
  });

  it('resolves firing trigger ids from every tag-trigger event name', () => {
    const config = service.createTag(
      'GA4',
      'acc',
      'cnt',
      tag,
      triggers,
      'false'
    );
    expect(config.firingTriggerId).toEqual(['20', '21', '10']);
  });

  it('emits sendEcommerceData, eventName, eventSettingsTable, measurementIdOverride in order', () => {
    const config = service.createTag(
      'GA4 Tag',
      'a',
      'c',
      tag,
      triggers,
      'false'
    );
    const keys = config.parameter?.map((p) => p.key);
    expect(keys).toEqual([
      'sendEcommerceData',
      'eventName',
      'eventSettingsTable',
      'measurementIdOverride'
    ]);
    // As Tag Manager exports it since the Google tag replaced the GA4
    // Configuration tag: the event tag reads the measurement ID itself.
    expect(config.parameter?.[3]).toEqual({
      type: 'TEMPLATE',
      key: 'measurementIdOverride',
      value: '{{CONST - Measurement ID}}'
    });
    expect(config.parameter?.[1]).toEqual({
      type: 'TEMPLATE',
      key: 'eventName',
      value: 'purchase'
    });
  });

  it('keeps every parameter when sendEcommerceData is "false"', () => {
    const config = service.createTag('GA4', 'a', 'c', tag, triggers, 'false');
    const eventParameters = config.parameter?.[2];
    expect(eventParameters?.list).toHaveLength(2);
  });

  it('drops parameters read from the ecommerce object when sendEcommerceData is "true"', () => {
    const config = service.createTag('GA4', 'a', 'c', tag, triggers, 'true');
    const eventParameters = config.parameter?.[2];
    expect(eventParameters?.list).toHaveLength(1);
    // remaining row wraps the surviving "currency" param as MAP/TEMPLATE
    expect(eventParameters?.list?.[0].map?.[0].value).toBe('currency');
  });

  it('writes parameters where GTM exports and TagCheck imports read them', () => {
    const config = service.createTag('GA4', 'a', 'c', tag, triggers, 'false');

    expect(
      getGa4EventParameterRows(
        { ...config, parameter: config.parameter ?? [] },
        []
      ).map(({ parameter }) => parameter)
    ).toEqual(['currency', 'items']);
  });

  it('includes notes when the tag carries TagCheck rules while still reading DLVs', () => {
    const tagWithNotes = {
      ...(tag as object),
      notes: 'TagCheck rules:\ncurrency = "TWD"\ntransaction_id ~ /^T\\d+$/'
    } as never;
    const config = service.createTag(
      'GA4',
      'a',
      'c',
      tagWithNotes,
      triggers,
      'false'
    );
    expect(config.notes).toBe(
      'TagCheck rules:\ncurrency = "TWD"\ntransaction_id ~ /^T\\d+$/'
    );
    const eventParameters = config.parameter?.[2];
    expect(eventParameters?.list?.[0].map?.[1].value).toBe('{{DLV - USD}}');
  });

  it('omits notes when the tag carries no rules', () => {
    const config = service.createTag('GA4', 'a', 'c', tag, triggers, 'false');
    expect(config.notes).toBeUndefined();
  });
});
