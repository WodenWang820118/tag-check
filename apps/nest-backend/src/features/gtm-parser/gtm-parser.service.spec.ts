import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { GtmParserService } from './gtm-parser.service';

function build() {
  const projectGtmContainerService = { save: vi.fn() };
  const projectEventsBuilderService = {
    buildEvents: vi.fn().mockResolvedValue({
      created: ['GA4 - page_view'],
      updated: [],
      unchanged: []
    })
  };
  const service = new GtmParserService(
    projectGtmContainerService as never,
    projectEventsBuilderService as never
  );
  return { service, projectGtmContainerService, projectEventsBuilderService };
}

const baseIds = { accountId: 'a', containerId: 'c' };

function ga4EventTag(
  name: string,
  eventName?: string,
  firingTriggerId = ['t1']
) {
  return {
    name,
    type: 'gaawe',
    ...baseIds,
    firingTriggerId,
    parameter: eventName
      ? [{ key: 'eventName', value: eventName, type: 'TEMPLATE' }]
      : []
  };
}

const dataLayerVariable = {
  name: 'DLV - ecommerce.value',
  type: 'v',
  ...baseIds,
  parameter: [{ key: 'name', value: 'ecommerce.value', type: 'TEMPLATE' }]
};
const builtInVariable = { name: 'Event', type: 'EVENT', ...baseIds };

const container = {
  exportFormatVersion: 2,
  exportTime: '2025-01-01 00:00:00',
  containerVersion: {
    variable: [dataLayerVariable],
    builtInVariable: [builtInVariable],
    trigger: [
      { triggerId: 't1', name: 'trigger-a', type: 'CUSTOM_EVENT', ...baseIds },
      { triggerId: 't2', name: 'trigger-b', type: 'CUSTOM_EVENT', ...baseIds }
    ],
    tag: [
      ga4EventTag('GA4 - page_view', 'page_view'),
      {
        name: 'Custom HTML',
        type: 'html',
        ...baseIds,
        parameter: [{ key: 'eventName', value: 'page_view', type: 'TEMPLATE' }]
      },
      ga4EventTag('GA4 - no name'),
      ga4EventTag('GA4 - dynamic', '{{Event}}'),
      ga4EventTag('GA4 - invalid', 'GA4 event - purchase')
    ]
  }
};

describe('GtmParserService', () => {
  it('saves the container and imports only GA4 event tags with their firing triggers', async () => {
    const ctx = build();

    const result = await ctx.service.uploadGtmJson('demo', container);

    expect(ctx.projectGtmContainerService.save).toHaveBeenCalledWith(
      'demo',
      container
    );
    expect(ctx.projectEventsBuilderService.buildEvents).toHaveBeenCalledWith(
      'demo',
      [
        {
          eventName: 'page_view',
          testName: 'GA4 - page_view',
          recording: { title: 'page_view', steps: [] },
          spec: {
            tag: container.containerVersion.tag[0],
            trigger: [container.containerVersion.trigger[0]]
          }
        }
      ],
      [dataLayerVariable, builtInVariable]
    );
    expect(result).toEqual({
      saved: true,
      created: ['GA4 - page_view'],
      updated: [],
      unchanged: [],
      skipped: [
        { tagName: 'Custom HTML', reason: 'Not a GA4 event tag' },
        { tagName: 'GA4 - no name', reason: 'No event name' },
        {
          tagName: 'GA4 - dynamic',
          reason: 'The event name {{Event}} is only known at runtime'
        },
        {
          tagName: 'GA4 - invalid',
          reason:
            'GA4 event names must start with a letter and use only letters, numbers and underscores (https://support.google.com/analytics/answer/13316687)'
        }
      ]
    });
  });

  it('accepts the export as text', async () => {
    const ctx = build();
    await ctx.service.uploadGtmJson('demo', JSON.stringify(container));
    expect(ctx.projectGtmContainerService.save).toHaveBeenCalledWith(
      'demo',
      container
    );
  });

  it.each([
    ['not-json{', 'The file is not valid JSON.'],
    [
      { not: 'gtm' },
      'The file is not a Tag Manager container export: containerVersion is missing.'
    ]
  ])('rejects %j with a 400 and saves nothing', async (payload, reason) => {
    const ctx = build();
    const upload = ctx.service.uploadGtmJson('demo', payload);
    await expect(upload).rejects.toBeInstanceOf(BadRequestException);
    await expect(upload).rejects.toThrow(reason);
    expect(ctx.projectGtmContainerService.save).not.toHaveBeenCalled();
    expect(ctx.projectEventsBuilderService.buildEvents).not.toHaveBeenCalled();
  });
});
