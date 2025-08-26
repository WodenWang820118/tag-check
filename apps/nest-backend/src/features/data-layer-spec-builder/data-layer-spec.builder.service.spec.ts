import { DataLayerSpecBuilderService } from './data-layer-spec.builder.service';
import { Spec, TagConfig, TriggerConfig } from '@utils';

describe('DataLayerSpecBuilderService', () => {
  let service: DataLayerSpecBuilderService;

  beforeEach(() => {
    service = new DataLayerSpecBuilderService();
  });

  it('builds event from tag parameter eventName', () => {
    const spec: Spec = {
      tag: {
        name: 'GA4 event - select_promotion',
        type: 'gaawe',
        accountId: 'acc',
        containerId: 'cont',
        parameter: [
          { type: 'TEMPLATE', key: 'eventName', value: 'select_promotion' },
          { type: 'LIST', key: 'eventSettingsTable', list: [] }
        ]
      } as unknown as TagConfig,
      trigger: [] as unknown as TriggerConfig[]
    };

    const result = service.buildDataLayerSpec(spec);
    expect(result.event).toBe('select_promotion');
  });

  it('throws when eventName missing', () => {
    const spec: Spec = {
      tag: {
        name: 'GA4 event - select_promotion',
        type: 'gaawe',
        accountId: 'acc',
        containerId: 'cont',
        parameter: []
      } as unknown as TagConfig,
      trigger: [] as unknown as TriggerConfig[]
    };

    expect(() => service.buildDataLayerSpec(spec)).toThrow(
      'eventName is required in spec'
    );
  });

  it('maps ecommerce parameter values verbatim (including items)', () => {
    const spec: Spec = {
      tag: {
        name: 'GA4 event - select_promotion',
        type: 'gaawe',
        accountId: 'acc',
        containerId: 'cont',
        parameter: [
          { type: 'TEMPLATE', key: 'eventName', value: 'select_promotion' },
          {
            type: 'LIST',
            key: 'eventSettingsTable',
            list: [
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'creative_name'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.creative_name}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'creative_slot'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.creative_slot}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  { type: 'TEMPLATE', key: 'parameter', value: 'promotion_id' },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.promotion_id}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'promotion_name'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.promotion_name}}'
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
                    value: '{{DLV - ecommerce.items}}'
                  }
                ]
              }
            ]
          }
        ]
      } as unknown as TagConfig,
      trigger: [] as unknown as TriggerConfig[]
    };

    const result = service.buildDataLayerSpec(spec);

    expect(result).toEqual({
      event: 'select_promotion',
      ecommerce: {
        creative_name: '{{DLV - ecommerce.creative_name}}',
        creative_slot: '{{DLV - ecommerce.creative_slot}}',
        promotion_id: '{{DLV - ecommerce.promotion_id}}',
        promotion_name: '{{DLV - ecommerce.promotion_name}}',
        items: '{{DLV - ecommerce.items}}'
      }
    });
  });

  it('ignores MAP entries without parameter or parameterValue', () => {
    const spec: Spec = {
      tag: {
        name: 'GA4 event - view_item',
        type: 'gaawe',
        accountId: 'acc',
        containerId: 'cont',
        parameter: [
          { type: 'TEMPLATE', key: 'eventName', value: 'view_item' },
          {
            type: 'LIST',
            key: 'eventSettingsTable',
            list: [
              {
                type: 'MAP',
                map: [{ type: 'TEMPLATE', key: 'parameter', value: 'value' }]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.value}}'
                  }
                ]
              },
              { type: 'MAP', map: [] }
            ]
          }
        ]
      } as unknown as TagConfig,
      trigger: [] as unknown as TriggerConfig[]
    };

    const result = service.buildDataLayerSpec(spec);

    // No usable pairs, ecommerce should be empty/undefined
    expect(result.event).toBe('view_item');
    expect(result.ecommerce).toBeUndefined();
  });
});
