import { describe, expect, it } from 'vitest';
import type { TagConfig, VariableConfig } from '../types/tag-build';
import {
  getDataLayerVariablePath,
  getGa4EventParameterRows,
  parseGtmContainerExport
} from './gtm-container-export';

const dataLayerVariable = (
  name: string,
  path: string,
  version = '2'
): VariableConfig => ({
  accountId: '1',
  containerId: '2',
  name,
  type: 'v',
  parameter: [
    { type: 'INTEGER', key: 'dataLayerVersion', value: version },
    { type: 'TEMPLATE', key: 'name', value: path }
  ]
});

const settingsRow = (parameter: string, value: string) => ({
  type: 'MAP',
  map: [
    { type: 'TEMPLATE', key: 'parameter', value: parameter },
    { type: 'TEMPLATE', key: 'parameterValue', value }
  ]
});

describe('parseGtmContainerExport', () => {
  const exported = {
    exportFormatVersion: 2,
    exportTime: '2026-10-19 10:00:00',
    containerVersion: {
      tag: [],
      trigger: [],
      variable: [],
      builtInVariable: []
    }
  };

  it('accepts a container export as text or as a parsed value', () => {
    expect(parseGtmContainerExport(JSON.stringify(exported)).container).toEqual(
      exported
    );
    expect(parseGtmContainerExport(exported).container).toEqual(exported);
  });

  it('treats lists a container does not use as empty', () => {
    const { container } = parseGtmContainerExport({
      exportFormatVersion: 2,
      exportTime: '2026-10-19 10:00:00',
      containerVersion: { tag: [] }
    });
    expect(container?.containerVersion.trigger).toEqual([]);
    expect(container?.containerVersion.variable).toEqual([]);
    expect(container?.containerVersion.builtInVariable).toEqual([]);
  });

  it.each([
    ['{not json', 'The file is not valid JSON.'],
    [
      { exportFormatVersion: 2 },
      'The file is not a Tag Manager container export: containerVersion is missing.'
    ],
    [
      { containerVersion: { tag: [] } },
      'The container export has an unexpected structure: check exportFormatVersion, exportTime and its tags, triggers and variables.'
    ]
  ])('rejects %j with a reason', (value, reason) => {
    expect(parseGtmContainerExport(value)).toEqual({ error: reason });
  });
});

describe('getDataLayerVariablePath', () => {
  const variables = [
    dataLayerVariable('DLV - ecommerce.value', 'ecommerce.value'),
    dataLayerVariable('DLV v1 - a.b', 'a.b', '1'),
    {
      accountId: '1',
      containerId: '2',
      name: 'Promo ID',
      type: 'jsm',
      parameter: []
    }
  ];

  it('returns the nested data layer path of a Data Layer Variable', () => {
    expect(
      getDataLayerVariablePath('{{DLV - ecommerce.value}}', variables)
    ).toEqual(['ecommerce', 'value']);
  });

  it('reads a version 1 variable name as one literal key', () => {
    expect(getDataLayerVariablePath('{{DLV v1 - a.b}}', variables)).toEqual([
      'a.b'
    ]);
  });

  it.each([
    '{{Promo ID}}',
    '{{Unknown}}',
    'USD',
    'prefix {{DLV - ecommerce.value}}'
  ])('returns null for %s', (reference) => {
    expect(getDataLayerVariablePath(reference, variables)).toBeNull();
  });
});

describe('getGa4EventParameterRows', () => {
  it('reads the tag table and the referenced Event Settings variable', () => {
    const tag = {
      name: 'GA4 event - purchase',
      type: 'gaawe',
      accountId: '1',
      containerId: '2',
      parameter: [
        { type: 'TEMPLATE', key: 'eventName', value: 'purchase' },
        {
          type: 'LIST',
          key: 'eventSettingsTable',
          list: [settingsRow('value', '{{DLV - ecommerce.value}}')]
        },
        {
          type: 'TEMPLATE',
          key: 'eventSettingsVariable',
          value: '{{Shared settings}}'
        }
      ]
    } as unknown as TagConfig;
    const variables = [
      {
        accountId: '1',
        containerId: '2',
        name: 'Shared settings',
        type: 'gtes',
        parameter: [
          {
            type: 'LIST',
            key: 'eventSettingsTable',
            list: [settingsRow('currency', '{{DLV - ecommerce.currency}}')]
          }
        ]
      }
    ] as unknown as VariableConfig[];

    expect(getGa4EventParameterRows(tag, variables)).toEqual([
      { parameter: 'value', value: '{{DLV - ecommerce.value}}' },
      { parameter: 'currency', value: '{{DLV - ecommerce.currency}}' }
    ]);
  });
});
