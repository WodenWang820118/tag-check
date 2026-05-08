import { TestBed } from '@angular/core/testing';

import { ParameterUtils } from './parameter-utils.service';

describe('ParameterUtils', () => {
  let service: ParameterUtils;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ParameterUtils);
  });

  it('creates a TEMPLATE parameter with key and value', () => {
    expect(service.createTemplateParameter('tagId', '{{x}}')).toEqual({
      type: 'TEMPLATE',
      key: 'tagId',
      value: '{{x}}'
    });
  });

  it('creates a BOOLEAN parameter', () => {
    expect(service.createBooleanParameter('sendPageView', 'false')).toEqual({
      type: 'BOOLEAN',
      key: 'sendPageView',
      value: 'false'
    });
  });

  it('creates an INTEGER parameter', () => {
    expect(service.createIntegerParameter('count', '5')).toEqual({
      type: 'INTEGER',
      key: 'count',
      value: '5'
    });
  });

  it('creates a TAG_REFERENCE parameter', () => {
    expect(service.createTagReferenceParameter('ref', '123')).toEqual({
      type: 'TAG_REFERENCE',
      key: 'ref',
      value: '123'
    });
  });

  it('creates a MAP parameter that wraps key and value as TEMPLATE entries', () => {
    expect(service.createMapParameter('event_name', 'click')).toEqual({
      type: 'MAP',
      map: [
        { type: 'TEMPLATE', key: 'parameter', value: 'event_name' },
        { type: 'TEMPLATE', key: 'parameterValue', value: 'click' }
      ]
    });
  });

  it('creates a built-in LIST parameter from existing map parameters', () => {
    const maps = [
      service.createMapParameter('a', '1'),
      service.createMapParameter('b', '2')
    ];
    const result = service.createBuiltInListParameter('items', maps);
    expect(result.type).toBe('LIST');
    expect(result.key).toBe('items');
    expect(result.list).toEqual(maps);
    // copy semantics: returned list is a new array
    expect(result.list).not.toBe(maps);
  });

  it('createListParameter wraps base parameters with DLV templates', () => {
    const base = [
      service.createTemplateParameter('event_name', 'page_view'),
      service.createTemplateParameter('user_id', 'uid')
    ];
    const result = service.createListParameter('event_parameters', base);
    expect(result.type).toBe('LIST');
    expect(result.key).toBe('event_parameters');
    expect(result.list).toHaveLength(2);
    const first = result.list?.[0];
    expect(first?.type).toBe('MAP');
    expect(first?.map?.[1]).toEqual({
      type: 'TEMPLATE',
      key: 'parameterValue',
      value: '{{DLV - page_view}}'
    });
  });

  it('findTriggerIdByEventName returns trigger ids matching the event name', () => {
    const triggers = [
      { name: 'click', triggerId: '1' },
      { name: 'scroll', triggerId: '2' },
      { name: 'click', triggerId: '3' }
    ] as never;
    expect(service.findTriggerIdByEventName('click', triggers)).toEqual([
      '1',
      '3'
    ]);
    expect(service.findTriggerIdByEventName('missing', triggers)).toEqual([]);
  });
});
