import { TestBed } from '@angular/core/testing';
import { VariableTypeEnum } from '@utils';

import { EventSettingsVariableService } from './event-settings-variable.service';

describe('EventSettingsVariableService', () => {
  let service: EventSettingsVariableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventSettingsVariableService);
  });

  it('returns an empty list when no ESV content is supplied', () => {
    expect(service.createEventSettingsVariable('a', 'c', [])).toEqual([]);
  });

  it('prefixes variable names with "ESV - " and tags accountId/containerId/type', () => {
    const result = service.createEventSettingsVariable('acc', 'cnt', [
      { name: 'purchase', parameters: [{ event_label: 'cta' }] }
    ] as never);

    expect(result).toHaveLength(1);
    const entry = result[0];
    expect(entry.accountId).toBe('acc');
    expect(entry.containerId).toBe('cnt');
    expect(entry.name).toBe('ESV - purchase');
    expect(entry.type).toBe(VariableTypeEnum.EVENT_SETTINGS);
  });

  it('emits an eventSettingsTable LIST whose items wrap each key/value pair as TEMPLATEs', () => {
    const result = service.createEventSettingsVariable('a', 'c', [
      {
        name: 'click',
        parameters: [{ event_category: 'engagement' }, { event_label: 'cta' }]
      }
    ] as never);

    const list = result[0].parameter?.[0];
    expect(list).toMatchObject({ type: 'LIST', key: 'eventSettingsTable' });
    expect(list?.list).toHaveLength(2);

    const first = list?.list?.[0];
    expect(first?.type).toBe('MAP');
    expect(first?.map).toEqual([
      { type: 'TEMPLATE', key: 'parameter', value: 'event_category' },
      { type: 'TEMPLATE', key: 'parameterValue', value: 'engagement' }
    ]);

    const second = list?.list?.[1];
    expect(second?.map?.[0]).toEqual({
      type: 'TEMPLATE',
      key: 'parameter',
      value: 'event_label'
    });
  });

  it('produces one variable entry per ESV input row', () => {
    const result = service.createEventSettingsVariable('a', 'c', [
      { name: 'view', parameters: [{ x: '1' }] },
      { name: 'click', parameters: [{ y: '2' }] }
    ] as never);
    expect(result.map((e) => e.name)).toEqual(['ESV - view', 'ESV - click']);
  });
});
