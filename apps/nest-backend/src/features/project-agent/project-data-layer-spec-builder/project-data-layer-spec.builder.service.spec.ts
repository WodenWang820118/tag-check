import { ProjectDataLayerSpecBuilderService } from './project-data-layer-spec.builder.service';
import { Spec, TagConfig, TriggerConfig, VariableConfig } from '@utils';

describe('ProjectDataLayerSpecBuilderService', () => {
  let service: ProjectDataLayerSpecBuilderService;

  beforeEach(() => {
    service = new ProjectDataLayerSpecBuilderService();
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

  it('legacy build maps every parameter value verbatim under ecommerce', () => {
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

    const result = service.buildLegacyDataLayerSpec(spec);

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

  describe('with the container variables', () => {
    const dataLayerVariable = (name: string, path: string) =>
      ({
        accountId: 'acc',
        containerId: 'cont',
        name,
        type: 'v',
        parameter: [
          { type: 'INTEGER', key: 'dataLayerVersion', value: '2' },
          { type: 'TEMPLATE', key: 'name', value: path }
        ]
      }) as VariableConfig;
    const variables: VariableConfig[] = [
      dataLayerVariable('DLV - ecommerce.value', 'ecommerce.value'),
      dataLayerVariable('DLV - ecommerce', 'ecommerce'),
      dataLayerVariable('DLV - first item id', 'ecommerce.items.0.item_id'),
      dataLayerVariable('DLV - method', 'method'),
      {
        accountId: 'acc',
        containerId: 'cont',
        name: '[custom JS] promo - promotion_id',
        type: 'jsm',
        parameter: []
      }
    ];
    const tagWith = (eventName: string, rows: [string, string][]): Spec => ({
      tag: {
        name: `GA4 event - ${eventName}`,
        type: 'gaawe',
        accountId: 'acc',
        containerId: 'cont',
        parameter: [
          { type: 'TEMPLATE', key: 'eventName', value: eventName },
          {
            type: 'LIST',
            key: 'eventSettingsTable',
            list: rows.map(([parameter, value]) => ({
              type: 'MAP',
              map: [
                { type: 'TEMPLATE', key: 'parameter', value: parameter },
                { type: 'TEMPLATE', key: 'parameterValue', value }
              ]
            }))
          }
        ]
      } as unknown as TagConfig,
      trigger: []
    });

    it('requires each Data Layer Variable at its data layer path', () => {
      expect(
        service.buildDataLayerSpec(
          tagWith('login', [['method', '{{DLV - method}}']]),
          variables
        )
      ).toEqual({ event: 'login', method: '{{DLV - method}}' });
    });

    it('leaves out parameters that do not come from the data layer', () => {
      expect(
        service.buildDataLayerSpec(
          tagWith('add_to_cart', [
            ['value', '{{DLV - ecommerce.value}}'],
            ['promotion_id', '{{[custom JS] promo - promotion_id}}'],
            ['debug_mode', 'false']
          ]),
          variables
        )
      ).toEqual({
        event: 'add_to_cart',
        ecommerce: { value: '{{DLV - ecommerce.value}}' }
      });
    });

    it('keeps nested requirements when a variable reads the whole object, in any order', () => {
      const expected = {
        event: 'purchase',
        ecommerce: { value: '{{DLV - ecommerce.value}}' }
      };
      expect(
        service.buildDataLayerSpec(
          tagWith('purchase', [
            ['value', '{{DLV - ecommerce.value}}'],
            ['ecommerce', '{{DLV - ecommerce}}']
          ]),
          variables
        )
      ).toEqual(expected);
      expect(
        service.buildDataLayerSpec(
          tagWith('purchase', [
            ['ecommerce', '{{DLV - ecommerce}}'],
            ['value', '{{DLV - ecommerce.value}}']
          ]),
          variables
        )
      ).toEqual(expected);
    });

    it('requires the array, not a position, for a variable that reads an array entry', () => {
      expect(
        service.buildDataLayerSpec(
          tagWith('view_item', [['item_id', '{{DLV - first item id}}']]),
          variables
        )
      ).toEqual({
        event: 'view_item',
        ecommerce: { items: '{{DLV - first item id}}' }
      });
    });

    describe('upgradeLegacyDataLayerSpec()', () => {
      const raw = tagWith('add_to_cart', [
        ['value', '{{DLV - ecommerce.value}}'],
        ['promotion_id', '{{[custom JS] promo - promotion_id}}']
      ]);

      it('rebuilds a stored spec that is still the unedited legacy build', () => {
        expect(
          service.upgradeLegacyDataLayerSpec(
            service.buildLegacyDataLayerSpec(raw),
            raw,
            variables
          )
        ).toEqual({
          event: 'add_to_cart',
          ecommerce: { value: '{{DLV - ecommerce.value}}' }
        });
      });

      it('keeps an edited spec', () => {
        const edited = {
          ...service.buildLegacyDataLayerSpec(raw),
          ecommerce: { value: 30 }
        };
        expect(
          service.upgradeLegacyDataLayerSpec(edited as never, raw, variables)
        ).toBeNull();
      });

      it('does nothing without the container variables or the raw tag', () => {
        const legacy = service.buildLegacyDataLayerSpec(raw);
        expect(service.upgradeLegacyDataLayerSpec(legacy, raw, [])).toBeNull();
        expect(
          service.upgradeLegacyDataLayerSpec(legacy, undefined, variables)
        ).toBeNull();
      });

      it('recognises both legacy and current builds as generated', () => {
        expect(
          service.isGeneratedDataLayerSpec(
            service.buildLegacyDataLayerSpec(raw),
            raw,
            variables
          )
        ).toBe(true);
        expect(
          service.isGeneratedDataLayerSpec(
            service.buildDataLayerSpec(raw, variables),
            raw,
            variables
          )
        ).toBe(true);
        expect(
          service.isGeneratedDataLayerSpec(
            { event: 'add_to_cart', custom: 1 } as never,
            raw,
            variables
          )
        ).toBe(false);
      });
    });
  });
});
