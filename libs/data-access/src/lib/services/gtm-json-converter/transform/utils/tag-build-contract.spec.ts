import {
  createPlaceholderTagConfig,
  createPlaceholderSpec,
  getParameterListItems,
  getParameterMapValue,
  getParameterValue,
  isGTMConfiguration,
  isParameter,
  isParameterWithKeyValue,
  isParameterListItem,
  isParameterMap,
  isSpec,
  isSpecArray,
  isStrictDataLayerEvent,
  isStrictDataLayerEventArray,
  isTagConfig,
  isTrigger,
  isTriggerConfig,
  isVariableConfig,
  validateGTMImportReadiness,
  TagTypeEnum,
  type TriggerConfig
} from '@utils';

describe('tag-build contract helpers', () => {
  const validTagParameter = {
    type: 'TEMPLATE',
    key: 'eventName',
    value: 'page_view'
  } as const;

  const validTrigger: TriggerConfig = {
    name: 'page_view',
    type: 'CUSTOM_EVENT',
    accountId: 'account-1',
    containerId: 'container-1',
    triggerId: 'trigger-1',
    firingTriggerId: ['trigger-2'],
    parameter: [validTagParameter]
  };

  const validVariable = {
    name: 'DLV - page_view',
    type: 'v',
    accountId: 'account-1',
    containerId: 'container-1',
    parameter: [validTagParameter]
  } as const;

  it('creates placeholder specs that satisfy the shared raw GTM spec contract', () => {
    const spec = createPlaceholderSpec('GA4 event - page_view');

    expect(isSpec(spec)).toBe(true);
    expect(spec.tag.name).toBe('GA4 event - page_view');
    expect(spec.tag.parameter).toEqual([]);
    expect(spec.trigger).toEqual([]);
  });

  it('supports placeholder overrides without breaking the raw GTM contract', () => {
    const spec = createPlaceholderSpec('GA4 event - page_view', {
      tag: {
        type: TagTypeEnum.GOOGLE_TAG,
        accountId: 'account-1',
        containerId: 'container-1',
        parameter: [validTagParameter]
      },
      trigger: [validTrigger]
    });

    expect(spec.tag.type).toBe(TagTypeEnum.GOOGLE_TAG);
    expect(spec.tag.accountId).toBe('account-1');
    expect(spec.tag.containerId).toBe('container-1');
    expect(spec.tag.parameter).toEqual([validTagParameter]);
    expect(spec.trigger).toEqual([validTrigger]);
    expect(isSpec(spec)).toBe(true);
  });

  it('creates placeholder tag configs with the documented defaults', () => {
    expect(
      createPlaceholderTagConfig({ name: 'GA4 event - page_view' })
    ).toEqual({
      name: 'GA4 event - page_view',
      type: TagTypeEnum.GAAWE,
      accountId: '',
      containerId: '',
      parameter: []
    });
  });

  it('recognizes valid GTM configuration objects and rejects invalid ones', () => {
    const configuration = {
      exportFormatVersion: 2,
      exportTime: '2026-04-22 00:00:00',
      containerVersion: {
        variable: [validVariable],
        builtInVariable: [
          {
            name: 'Page URL',
            type: 'PAGE_URL',
            accountId: 'account-1',
            containerId: 'container-1'
          }
        ],
        trigger: [validTrigger],
        tag: [createPlaceholderSpec('GA4 event - page_view').tag]
      }
    };

    expect(isGTMConfiguration(configuration)).toBe(true);
    expect(isGTMConfiguration({ exportFormatVersion: 2 })).toBe(false);
    expect(
      isGTMConfiguration({
        ...configuration,
        exportFormatVersion: '2'
      })
    ).toBe(false);
    expect(
      isGTMConfiguration({
        ...configuration,
        exportTime: 123
      })
    ).toBe(false);
    expect(
      isGTMConfiguration({
        ...configuration,
        containerVersion: {
          ...configuration.containerVersion,
          tag: [{ ...configuration.containerVersion.tag[0], parameter: 'bad' }]
        }
      })
    ).toBe(false);
    expect(
      isGTMConfiguration({
        ...configuration,
        containerVersion: {
          ...configuration.containerVersion,
          variable: [{ ...validVariable, parameter: 'bad' }]
        }
      })
    ).toBe(false);
    expect(
      isGTMConfiguration({
        ...configuration,
        containerVersion: {
          ...configuration.containerVersion,
          builtInVariable: [
            {
              ...configuration.containerVersion.builtInVariable[0],
              parameter: 'bad'
            }
          ]
        }
      })
    ).toBe(false);
    expect(
      isGTMConfiguration({
        ...configuration,
        containerVersion: {
          ...configuration.containerVersion,
          trigger: [{ ...validTrigger, firingTriggerId: 'trigger-2' }]
        }
      })
    ).toBe(false);
  });

  it('validates GTM import readiness for a complete container export', () => {
    const configuration = {
      exportFormatVersion: 2,
      exportTime: '2026-04-22 00:00:00',
      containerVersion: {
        path: 'accounts/account-1/containers/container-1/versions/0',
        accountId: 'account-1',
        containerId: 'container-1',
        containerVersionId: '0',
        container: {
          path: 'accounts/account-1/containers/container-1',
          accountId: 'account-1',
          containerId: 'container-1',
          name: 'validation',
          publicId: 'GTM-WJ6N3RM',
          usageContext: ['WEB'],
          fingerprint: '1690281340453',
          tagManagerUrl:
            'https://tagmanager.google.com/#/container/accounts/account-1/containers/container-1/workspaces?apiLink=container',
          features: {
            supportUserPermissions: true,
            supportEnvironments: true,
            supportWorkspaces: true,
            supportGtagConfigs: false,
            supportBuiltInVariables: true,
            supportClients: false,
            supportFolders: true,
            supportTags: true,
            supportTemplates: true,
            supportTriggers: true,
            supportVariables: true,
            supportVersions: true,
            supportZones: true,
            supportTransformations: false
          },
          tagIds: ['GTM-WJ6N3RM']
        },
        variable: [validVariable],
        builtInVariable: [
          {
            name: 'Page URL',
            type: 'PAGE_URL',
            accountId: 'account-1',
            containerId: 'container-1'
          }
        ],
        trigger: [validTrigger],
        tag: [
          createPlaceholderTagConfig({
            name: 'GA4 event - page_view',
            accountId: 'account-1',
            containerId: 'container-1'
          })
        ],
        fingerprint: '1690374452646',
        tagManagerUrl:
          'https://tagmanager.google.com/#/versions/accounts/account-1/containers/container-1/versions/0?apiLink=version'
      }
    };

    expect(validateGTMImportReadiness(configuration)).toEqual({
      canImport: true,
      issues: [],
      warnings: []
    });
  });

  it('reports non-GTM JSON as not ready for GTM import', () => {
    expect(validateGTMImportReadiness({})).toEqual({
      canImport: false,
      issues: ['Output is not a GTM container export JSON structure.'],
      warnings: []
    });
  });

  it('does not throw when a shallow GTM shape is missing import fields', () => {
    expect(
      validateGTMImportReadiness({
        exportFormatVersion: 2,
        exportTime: '2026-04-22 00:00:00',
        containerVersion: {
          variable: [],
          builtInVariable: [],
          trigger: [],
          tag: []
        }
      })
    ).toEqual({
      canImport: false,
      issues: [
        'containerVersion.path must be present.',
        'containerVersion.accountId must be present.',
        'containerVersion.containerId must be present.',
        'containerVersion.containerVersionId must be present.',
        'containerVersion.fingerprint must be present.',
        'containerVersion.tagManagerUrl must be present.',
        'containerVersion.container must be present.',
        'containerVersion path must match accountId, containerId, and version ID.'
      ],
      warnings: ['The export has no tags.', 'The export has no triggers.']
    });
  });

  it('reports GTM import readiness issues without claiming API upload success', () => {
    const configuration = {
      exportFormatVersion: 2,
      exportTime: '2026-04-22 00:00:00',
      containerVersion: {
        path: 'accounts/account-1/containers/container-1/versions/0',
        accountId: 'account-1',
        containerId: 'container-1',
        containerVersionId: '0',
        container: {
          path: 'accounts/account-1/containers/container-1',
          accountId: 'account-1',
          containerId: 'container-1',
          name: 'validation',
          publicId: 'NOT-A-GTM-ID',
          usageContext: [],
          fingerprint: '1690281340453',
          tagManagerUrl:
            'https://tagmanager.google.com/#/container/accounts/account-1/containers/container-1/workspaces?apiLink=container',
          features: {
            supportUserPermissions: true,
            supportEnvironments: true,
            supportWorkspaces: true,
            supportGtagConfigs: false,
            supportBuiltInVariables: true,
            supportClients: false,
            supportFolders: true,
            supportTags: true,
            supportTemplates: true,
            supportTriggers: true,
            supportVariables: true,
            supportVersions: true,
            supportZones: true,
            supportTransformations: false
          },
          tagIds: []
        },
        variable: [],
        builtInVariable: [],
        trigger: [],
        tag: [
          createPlaceholderTagConfig({
            name: 'GA4 event - page_view',
            accountId: 'other-account',
            containerId: 'container-1'
          })
        ],
        fingerprint: '1690374452646',
        tagManagerUrl:
          'https://tagmanager.google.com/#/versions/accounts/account-1/containers/container-1/versions/0?apiLink=version'
      }
    };

    const readiness = validateGTMImportReadiness(configuration);

    expect(readiness).toEqual({
      canImport: false,
      issues: [
        'container publicId must look like a GTM container ID.',
        'container usageContext must include WEB.',
        'tag[0].accountId must match the container.'
      ],
      warnings: [
        'The export has no container tag IDs.',
        'The export has no triggers.'
      ]
    });
  });

  it('validates parameter helpers at the guard layer directly', () => {
    expect(isParameter({ type: 'TEMPLATE' })).toBe(true);
    expect(isParameter({ type: 'TEMPLATE', key: 42 })).toBe(false);
    expect(isParameter({ type: 'TEMPLATE', value: 42 })).toBe(false);
    expect(isParameter({ type: 'LIST', list: 'bad' })).toBe(false);
    expect(isParameter({ type: 'LIST', list: [{ type: 123 }] })).toBe(false);
    expect(
      isParameterWithKeyValue({
        type: 'TEMPLATE',
        key: 'eventName',
        value: 'page_view'
      })
    ).toBe(true);
    expect(
      isParameterWithKeyValue({ type: 'TEMPLATE', key: 'eventName' })
    ).toBe(false);
    expect(
      isParameterWithKeyValue({ type: 'TEMPLATE', value: 'page_view' })
    ).toBe(false);
    expect(isParameterWithKeyValue({ type: 'TEMPLATE' })).toBe(false);
    expect(isParameterMap({ type: 'MAP', map: [validTagParameter] })).toBe(
      true
    );
    expect(isParameterMap({ type: 'MAP', map: [{ type: 123 }] })).toBe(false);
    expect(isParameterMap({ type: 'TEMPLATE', map: [] })).toBe(false);
    expect(isParameterListItem(validTagParameter)).toBe(true);
    expect(isParameterListItem({ type: 'MAP', map: [validTagParameter] })).toBe(
      true
    );
    expect(isParameterListItem({ type: 'TEMPLATE', map: 'bad' })).toBe(false);
    expect(isParameterListItem({ type: 'TEMPLATE', value: 99 })).toBe(false);
  });

  it('validates basic trigger guards directly', () => {
    expect(isTrigger({ name: 'page_view', triggerId: '1' })).toBe(true);
    expect(isTrigger({ name: 'page_view', triggerId: 1 })).toBe(false);
    expect(isTrigger({ name: 'page_view' })).toBe(false);
    expect(isTrigger(null)).toBe(false);
  });

  it('recognizes strict data-layer event arrays', () => {
    expect(isStrictDataLayerEvent({ event: 'page_view' })).toBe(true);
    expect(isStrictDataLayerEvent({ event: 123 })).toBe(false);
    expect(
      isStrictDataLayerEventArray([
        { event: 'page_view' },
        { event: 'purchase', value: '799' }
      ])
    ).toBe(true);
    expect(isStrictDataLayerEventArray([{ name: 'missing event' }])).toBe(
      false
    );
    expect(isStrictDataLayerEventArray([{ event: 123 }])).toBe(false);
  });

  it('documents that an empty event array is still structurally valid', () => {
    expect(isStrictDataLayerEventArray([])).toBe(true);
  });

  it('reads parameter values through the shared helper layer', () => {
    const parameters = [
      {
        type: 'TEMPLATE',
        key: 'eventName',
        value: 'page_view'
      },
      {
        type: 'INTEGER',
        key: 'value',
        value: '799'
      }
    ];

    expect(getParameterValue(parameters, 'eventName')).toBe('page_view');
    expect(getParameterValue(parameters, 'value', 'INTEGER')).toBe('799');
    expect(getParameterValue(parameters, 'value', 'TEMPLATE')).toBeUndefined();
    expect(getParameterValue(parameters, 'missing')).toBeUndefined();
  });

  it('returns safe fallback values for nullable list and map lookups', () => {
    const listParameter = {
      type: 'LIST',
      key: 'eventSettingsTable',
      list: [
        {
          type: 'MAP',
          map: [
            {
              type: 'TEMPLATE',
              key: 'parameter',
              value: 'currency'
            },
            {
              type: 'TEMPLATE',
              key: 'parameterValue',
              value: '{{DLV - ecommerce.currency}}'
            }
          ]
        }
      ]
    } as const;

    const list = getParameterListItems(listParameter);

    expect(getParameterListItems(null)).toEqual([]);
    expect(getParameterListItems(undefined)).toEqual([]);
    expect(list).toHaveLength(1);
    expect(getParameterMapValue(list[0], 'parameterValue')).toBe(
      '{{DLV - ecommerce.currency}}'
    );
    expect(
      getParameterMapValue(
        {
          type: 'TEMPLATE',
          key: 'parameter',
          value: 'currency'
        },
        'parameterValue'
      )
    ).toBeUndefined();
    expect(getParameterMapValue(null, 'parameterValue')).toBeUndefined();
  });

  it('rejects malformed tag configs', () => {
    expect(
      isTagConfig({
        name: 'GA4 event - page_view',
        type: TagTypeEnum.GAAWE,
        accountId: 'account-1',
        containerId: 'container-1',
        parameter: [validTagParameter],
        firingTriggerId: ['trigger-1'],
        tagFiringOption: 'ONCE_PER_EVENT'
      })
    ).toBe(true);
    expect(
      isTagConfig({
        name: 'GA4 event - page_view',
        type: TagTypeEnum.GAAWE,
        accountId: 'account-1',
        containerId: 'container-1',
        parameter: 'bad'
      })
    ).toBe(false);
    expect(
      isTagConfig({
        name: 'GA4 event - page_view',
        type: TagTypeEnum.GAAWE,
        accountId: 'account-1',
        containerId: 'container-1',
        parameter: [validTagParameter],
        firingTriggerId: 'trigger-1'
      })
    ).toBe(false);
    expect(
      isTagConfig({
        name: 'GA4 event - page_view',
        type: TagTypeEnum.GAAWE,
        accountId: 'account-1',
        containerId: 'container-1',
        parameter: [validTagParameter],
        tagFiringOption: 1
      })
    ).toBe(false);
  });

  it('accepts and rejects trigger configs through direct guard tests', () => {
    expect(isTriggerConfig(validTrigger)).toBe(true);
    expect(
      isTriggerConfig({
        ...validTrigger,
        type: undefined
      })
    ).toBe(false);
    expect(
      isTriggerConfig({
        ...validTrigger,
        firingTriggerId: 'trigger-2'
      })
    ).toBe(false);
    expect(
      isTriggerConfig({
        ...validTrigger,
        triggerId: 123
      })
    ).toBe(false);
    expect(
      isTriggerConfig({
        ...validTrigger,
        parameter: [{ type: 123 }]
      })
    ).toBe(false);
  });

  it('accepts and rejects variable configs through direct guard tests', () => {
    expect(isVariableConfig(validVariable)).toBe(true);
    expect(
      isVariableConfig({
        name: 'Page URL',
        type: 'PAGE_URL',
        accountId: 'account-1',
        containerId: 'container-1'
      })
    ).toBe(true);
    expect(
      isVariableConfig({
        ...validVariable,
        containerId: undefined
      })
    ).toBe(false);
    expect(
      isVariableConfig({
        ...validVariable,
        parameter: [{ type: 123 }]
      })
    ).toBe(false);
  });

  it('recognizes spec arrays through the shared contract helper', () => {
    const spec = createPlaceholderSpec('GA4 event - page_view', {
      trigger: [validTrigger]
    });

    expect(isSpec(spec)).toBe(true);
    expect(isSpec({ tag: spec.tag })).toBe(false);
    expect(isSpec({ trigger: spec.trigger })).toBe(false);
    expect(isSpecArray([spec])).toBe(true);
    expect(isSpecArray([])).toBe(true);
    expect(isSpecArray([{ tag: spec.tag }])).toBe(false);
  });

  it('rejects missing required tag config fields at baseline', () => {
    expect(isTagConfig({})).toBe(false);
  });
});
