import { describe, expect, it } from 'vitest';
import type {
  TagConfig,
  TriggerConfig,
  VariableConfig
} from '../types/tag-build';
import { parseGtmContainerExport } from './gtm-container-export';
import { extractMeasurementPlan } from './measurement-plan-extract';
import {
  measurementPlanToDataLayerSpecs,
  parseMeasurementPlanRows
} from './measurement-plan';

const ids = { accountId: '1', containerId: '2' };

const dataLayerVariable = (name: string, path: string): VariableConfig => ({
  ...ids,
  name,
  type: 'v',
  parameter: [
    { type: 'INTEGER', key: 'dataLayerVersion', value: '2' },
    { type: 'TEMPLATE', key: 'name', value: path }
  ]
});

const constantVariable = (name: string, value: string): VariableConfig => ({
  ...ids,
  name,
  type: 'c',
  parameter: [{ type: 'TEMPLATE', key: 'value', value }]
});

const settingsRow = (parameter: string, value: string) => ({
  type: 'MAP',
  map: [
    { type: 'TEMPLATE', key: 'parameter', value: parameter },
    { type: 'TEMPLATE', key: 'parameterValue', value }
  ]
});

const eventTag = (
  name: string,
  eventName: string,
  rows: [string, string][],
  extra: Partial<TagConfig> & { sendEcommerceData?: boolean } = {}
): TagConfig => {
  const { sendEcommerceData, ...rest } = extra;
  return {
    ...ids,
    name,
    type: 'gaawe',
    parameter: [
      {
        type: 'BOOLEAN',
        key: 'sendEcommerceData',
        value: String(sendEcommerceData === true)
      },
      { type: 'TEMPLATE', key: 'eventName', value: eventName },
      {
        type: 'LIST',
        key: 'eventSettingsTable',
        list: rows.map(([parameter, value]) => settingsRow(parameter, value))
      }
    ],
    ...rest
  };
};

const customEventTrigger = (
  triggerId: string,
  name: string,
  type: string,
  value: string
): TriggerConfig => ({
  ...ids,
  triggerId,
  name,
  type: 'CUSTOM_EVENT',
  customEventFilter: [
    {
      type,
      parameter: [
        { type: 'TEMPLATE', key: 'arg0', value: '{{_event}}' },
        { type: 'TEMPLATE', key: 'arg1', value }
      ]
    }
  ]
});

function extract(
  tag: TagConfig[],
  trigger: TriggerConfig[] = [],
  variable: VariableConfig[] = []
) {
  const { container, error } = parseGtmContainerExport({
    exportFormatVersion: 2,
    exportTime: '2026-10-26 10:00:00',
    containerVersion: { tag, trigger, variable, builtInVariable: [] }
  });
  if (!container) {
    throw new Error(error);
  }
  return extractMeasurementPlan(container);
}

const variables = [
  dataLayerVariable('DLV - ecommerce.value', 'ecommerce.value'),
  dataLayerVariable('DLV - ecommerce.currency', 'ecommerce.currency'),
  dataLayerVariable('DLV - ecommerce.items', 'ecommerce.items'),
  dataLayerVariable('DLV - method', 'method'),
  constantVariable('CONST - provider', 'youtube')
];

describe('extractMeasurementPlan', () => {
  it("lists a GA4 event tag's event name and parameters", () => {
    const result = extract(
      [
        eventTag('GA4 - login', 'login', [['method', '{{DLV - method}}']]),
        { ...ids, name: 'Google tag', type: 'googtag', parameter: [] }
      ],
      [],
      variables
    );
    expect(result).toEqual({
      rows: [
        {
          eventName: 'login',
          eventParameters: ['method'],
          itemParameters: [],
          notes: []
        }
      ],
      skipped: [],
      ga4EventTagCount: 1
    });
  });

  it('turns an items parameter into the minimum item parameters', () => {
    const [row] = extract(
      [
        eventTag('GA4 - add_to_cart', 'add_to_cart', [
          ['value', '{{DLV - ecommerce.value}}'],
          ['currency', '{{DLV - ecommerce.currency}}'],
          ['items', '{{DLV - ecommerce.items}}']
        ])
      ],
      [],
      variables
    ).rows;
    expect(row.eventParameters).toEqual(['value', 'currency']);
    expect(row.itemParameters).toEqual(['item_id', 'item_name']);
    expect(row.notes).toEqual([
      expect.stringContaining('Item parameters are not in the container')
    ]);
  });

  it("adds Google's recommended parameters when the tag sends ecommerce data", () => {
    const [row] = extract(
      [
        eventTag('GA4 - begin_checkout', 'begin_checkout', [], {
          sendEcommerceData: true
        })
      ],
      [],
      variables
    ).rows;
    expect(row.eventParameters).toEqual(['currency', 'value', 'coupon']);
    expect(row.itemParameters).toEqual(['item_id', 'item_name']);
    expect(row.notes[0]).toContain("Google's recommended ones");
  });

  it('notes parameters that are not read from the data layer', () => {
    const [row] = extract(
      [
        eventTag('GA4 - video', 'video_start', [
          ['video_provider', '{{CONST - provider}}'],
          ['video_title', '{{Video Title}}'],
          ['source', 'site']
        ])
      ],
      [],
      variables
    ).rows;
    expect(row.notes).toEqual([
      'Not read directly from the data layer: video_provider = "youtube"; video_title from {{Video Title}}; source = "site".'
    ]);
  });

  it('reads {{Event}} from the custom event triggers', () => {
    const result = extract(
      [
        eventTag(
          'GA4 - YouTube',
          '{{Event}}',
          [['video_title', '{{Video Title}}']],
          { firingTriggerId: ['1', '2', '3'] }
        )
      ],
      [
        customEventTrigger('1', 'youtube_start', 'EQUALS', 'youtube_start'),
        customEventTrigger(
          '2',
          'youtube progress',
          'MATCH_REGEX',
          '^(youtube_progress|youtube_complete)$'
        ),
        customEventTrigger('3', 'any youtube', 'MATCH_REGEX', 'youtube_.*')
      ],
      variables
    );
    expect(result.rows.map((row) => row.eventName)).toEqual([
      'youtube_start',
      'youtube_progress',
      'youtube_complete'
    ]);
    expect(result.skipped).toEqual([
      'Tag "GA4 - YouTube": the event name is {{Event}} and trigger "any youtube" does not name its custom events; add them by hand.'
    ]);
  });

  it('uses a Constant event name and skips one only known at run time', () => {
    const result = extract(
      [
        eventTag('GA4 - const', '{{CONST - name}}', []),
        eventTag('GA4 - dynamic', '{{DLV - method}}', [])
      ],
      [],
      [...variables, constantVariable('CONST - name', 'sign_up')]
    );
    expect(result.rows.map((row) => row.eventName)).toEqual(['sign_up']);
    expect(result.skipped).toEqual([
      'Tag "GA4 - dynamic": the event name {{DLV - method}} is only known at run time; add its events by hand.'
    ]);
  });

  it('skips paused tags and names GA4 does not accept', () => {
    const result = extract([
      eventTag('GA4 - old', 'old_event', [], { paused: true }),
      eventTag('GA4 - bad', 'gtm.video', [])
    ]);
    expect(result.rows).toEqual([]);
    expect(result.skipped).toEqual([
      'Tag "GA4 - old": paused.',
      'Tag "GA4 - bad": "gtm.video" is not a valid GA4 event name: it must start with a letter and use only letters, numbers and underscores.'
    ]);
    expect(result.ga4EventTagCount).toBe(2);
  });

  it('merges tags that send the same event', () => {
    const [row, ...others] = extract(
      [
        eventTag('GA4 - login A', 'login', [['method', '{{DLV - method}}']]),
        eventTag('GA4 - login B', 'login', [['source', 'site']])
      ],
      [],
      variables
    ).rows;
    expect(others).toEqual([]);
    expect(row.eventParameters).toEqual(['method', 'source']);
    expect(row.notes).toContain(
      'Merged from tags: "GA4 - login A", "GA4 - login B".'
    );
  });

  it('round-trips through the plan parser into dataLayer specs', () => {
    const { rows } = extract(
      [
        eventTag('GA4 - add_to_cart', 'add_to_cart', [
          ['value', '{{DLV - ecommerce.value}}'],
          ['items', '{{DLV - ecommerce.items}}']
        ])
      ],
      [],
      variables
    );
    const table = [
      ['event_name', 'event_parameters', 'item_parameters', 'notes'],
      ...rows.map((row) => [
        row.eventName,
        row.eventParameters.join(', '),
        row.itemParameters.join(', '),
        row.notes.join(' ')
      ])
    ];
    const parsed = parseMeasurementPlanRows(table);
    expect(parsed.issues).toEqual([]);
    expect(measurementPlanToDataLayerSpecs(parsed.rows)).toEqual([
      {
        event: 'add_to_cart',
        ecommerce: {
          value: '$value',
          items: [{ item_id: '$item_id', item_name: '$item_name' }]
        }
      }
    ]);
  });
});
