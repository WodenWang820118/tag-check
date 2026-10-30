import { describe, expect, it, vi } from 'vitest';
import { BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { GtmParserService } from './gtm-parser.service';

function build() {
  const projectGtmContainerService = { save: vi.fn() };
  const projectEventsBuilderService = {
    buildEvents: vi.fn().mockResolvedValue({
      created: ['GA4 - page_view'],
      updated: [],
      unchanged: [],
      renamed: [],
      keptBoth: []
    }),
    findImportConflicts: vi.fn().mockResolvedValue([])
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
      [dataLayerVariable, builtInVariable],
      {}
    );
    expect(result).toEqual({
      saved: true,
      created: ['GA4 - page_view'],
      updated: [],
      unchanged: [],
      renamed: [],
      keptBoth: [],
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

  it('imports an active GA4 event tag and skips a paused one', async () => {
    const ctx = build();
    const active = ga4EventTag('GA4 - page_view', 'page_view');
    const paused = {
      ...ga4EventTag('GA4 - old_event', 'old_event'),
      paused: true
    };
    const payload = {
      ...container,
      containerVersion: {
        ...container.containerVersion,
        tag: [active, paused]
      }
    };
    const log = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);

    try {
      const result = await ctx.service.uploadGtmJson('demo', payload);

      const inputs =
        ctx.projectEventsBuilderService.buildEvents.mock.calls[0]?.[1];
      expect(inputs).toEqual([
        {
          eventName: 'page_view',
          testName: 'GA4 - page_view',
          recording: { title: 'page_view', steps: [] },
          spec: {
            tag: active,
            trigger: [container.containerVersion.trigger[0]]
          }
        }
      ]);
      expect(result.skipped).toContainEqual({
        tagName: 'GA4 - old_event',
        reason: 'Paused'
      });
      expect(
        log.mock.calls.some(
          (call) =>
            typeof call[0] === 'string' && call[0].includes('GA4 - old_event')
        )
      ).toBe(true);
    } finally {
      log.mockRestore();
    }
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
    expect(
      ctx.projectEventsBuilderService.findImportConflicts
    ).not.toHaveBeenCalled();
  });

  it('forwards resolutions when every event-name conflict is resolved', async () => {
    const ctx = build();
    ctx.projectEventsBuilderService.findImportConflicts.mockResolvedValue([
      {
        tagName: 'GA4 - page_view',
        existingEventName: 'page_view',
        newEventName: 'screen_view',
        specEdited: false
      }
    ]);
    const resolutions = { 'GA4 - page_view': 'update' as const };

    await ctx.service.uploadGtmJson('demo', { container, resolutions });

    expect(ctx.projectGtmContainerService.save).toHaveBeenCalledWith(
      'demo',
      container
    );
    expect(ctx.projectEventsBuilderService.buildEvents).toHaveBeenCalledWith(
      'demo',
      expect.any(Array),
      expect.any(Array),
      resolutions
    );
  });

  it('returns 409 and writes nothing when a conflict has no resolution', async () => {
    const ctx = build();
    const conflicts = [
      {
        tagName: 'GA4 - page_view',
        existingEventName: 'page_view',
        newEventName: 'screen_view',
        specEdited: false
      },
      {
        tagName: 'GA4 - refund',
        existingEventName: 'refund',
        newEventName: 'refund_issued',
        specEdited: true
      }
    ];
    ctx.projectEventsBuilderService.findImportConflicts.mockResolvedValue(
      conflicts
    );

    let thrown: unknown;
    try {
      await ctx.service.uploadGtmJson('demo', {
        container,
        resolutions: { 'GA4 - page_view': 'keepBoth' }
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ConflictException);
    if (thrown instanceof ConflictException) {
      expect(thrown.getStatus()).toBe(409);
      expect(thrown.getResponse()).toMatchObject({
        conflicts: [
          expect.objectContaining({
            tagName: 'GA4 - refund',
            specEdited: true
          })
        ]
      });
    }
    expect(ctx.projectGtmContainerService.save).not.toHaveBeenCalled();
    expect(ctx.projectEventsBuilderService.buildEvents).not.toHaveBeenCalled();
  });

  it('rejects a resolution other than update or keep both and writes nothing', async () => {
    const ctx = build();
    const body = {
      container,
      resolutions: { 'GA4 - page_view': 'rename' }
    };
    const upload = ctx.service.uploadGtmJson('demo', body);
    await expect(upload).rejects.toBeInstanceOf(BadRequestException);
    expect(ctx.projectGtmContainerService.save).not.toHaveBeenCalled();
    expect(
      ctx.projectEventsBuilderService.findImportConflicts
    ).not.toHaveBeenCalled();
    expect(ctx.projectEventsBuilderService.buildEvents).not.toHaveBeenCalled();
  });

  it('preview reports conflicts and writes nothing', async () => {
    const ctx = build();
    const conflict = {
      tagName: 'GA4 - page_view',
      existingEventName: 'page_view',
      newEventName: 'screen_view',
      specEdited: true
    };
    ctx.projectEventsBuilderService.findImportConflicts.mockResolvedValue([
      conflict
    ]);

    await expect(
      ctx.service.previewGtmJson('demo', container)
    ).resolves.toEqual({ conflicts: [conflict] });
    expect(
      ctx.projectEventsBuilderService.findImportConflicts
    ).toHaveBeenCalledWith(
      'demo',
      [
        expect.objectContaining({
          testName: 'GA4 - page_view',
          eventName: 'page_view'
        })
      ],
      [dataLayerVariable, builtInVariable]
    );
    expect(ctx.projectGtmContainerService.save).not.toHaveBeenCalled();
    expect(ctx.projectEventsBuilderService.buildEvents).not.toHaveBeenCalled();
  });

  it('preview accepts the upload body shapes and still writes nothing', async () => {
    const ctx = build();

    await ctx.service.previewGtmJson('demo', JSON.stringify(container));
    await ctx.service.previewGtmJson('demo', {
      container,
      resolutions: { 'GA4 - page_view': 'keepBoth' }
    });

    expect(
      ctx.projectEventsBuilderService.findImportConflicts
    ).toHaveBeenCalledTimes(2);
    expect(ctx.projectGtmContainerService.save).not.toHaveBeenCalled();
    expect(ctx.projectEventsBuilderService.buildEvents).not.toHaveBeenCalled();
  });

  it('preview rejects an invalid file and writes nothing', async () => {
    const ctx = build();
    await expect(
      ctx.service.previewGtmJson('demo', 'not-json{')
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(ctx.projectGtmContainerService.save).not.toHaveBeenCalled();
    expect(ctx.projectEventsBuilderService.buildEvents).not.toHaveBeenCalled();
    expect(
      ctx.projectEventsBuilderService.findImportConflicts
    ).not.toHaveBeenCalled();
  });
});
