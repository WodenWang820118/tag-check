import { TestBed } from '@angular/core/testing';
import { TagTypeEnum } from '@utils';

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
    { type: 'TEMPLATE', key: 'items', value: 'ecommerce_items' }
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

  it('emits sendEcommerceData, eventName, eventParameters, measurementId in order', () => {
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
      'eventParameters',
      'measurementId'
    ]);
    expect(config.parameter?.[3]).toEqual({
      type: 'TAG_REFERENCE',
      key: 'measurementId',
      value: 'GA4 Tag'
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

  it('drops parameters whose value mentions ecommerce when sendEcommerceData is "true"', () => {
    const config = service.createTag('GA4', 'a', 'c', tag, triggers, 'true');
    const eventParameters = config.parameter?.[2];
    expect(eventParameters?.list).toHaveLength(1);
    // remaining row wraps the surviving "currency" param as MAP/TEMPLATE
    expect(eventParameters?.list?.[0].map?.[0].value).toBe('currency');
  });
});
