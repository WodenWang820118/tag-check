import { describe, expect, it, vi } from 'vitest';
import { ProjectEventsBuilderService } from './project-events-builder.service';

function build(existingEvents: unknown[] = []) {
  const projectReportService = { createEventReportFolder: vi.fn() };
  const testReportFacadeRepositoryService = { createFullReport: vi.fn() };
  const projectRecordingService = { addRecording: vi.fn() };
  const dataLayerSpecBuilderService = {
    buildDataLayerSpec: vi.fn().mockReturnValue({ event: 'page_view' }),
    isGeneratedDataLayerSpec: vi.fn().mockReturnValue(true),
    upgradeLegacyDataLayerSpec: vi.fn().mockReturnValue(null)
  };
  const testEventRepositoryService = {
    listFileReports: vi.fn().mockResolvedValue(existingEvents)
  };
  const specRepositoryService = { update: vi.fn() };
  const projectGtmContainerService = { read: vi.fn().mockResolvedValue(null) };
  const service = new ProjectEventsBuilderService(
    projectReportService as never,
    testReportFacadeRepositoryService as never,
    projectRecordingService as never,
    dataLayerSpecBuilderService as never,
    testEventRepositoryService as never,
    specRepositoryService as never,
    projectGtmContainerService as never
  );
  return {
    service,
    projectReportService,
    testReportFacadeRepositoryService,
    projectRecordingService,
    dataLayerSpecBuilderService,
    testEventRepositoryService,
    specRepositoryService,
    projectGtmContainerService
  };
}

const pageViewInput = {
  eventName: 'page_view',
  testName: 'tag-a',
  recording: { title: 'page_view', steps: [] },
  spec: { tag: {}, trigger: [] } as never
};

describe('ProjectEventsBuilderService', () => {
  it('buildEvents() short-circuits with no inputs', async () => {
    const ctx = build();
    await expect(ctx.service.buildEvents('demo', [])).resolves.toEqual({
      created: [],
      updated: [],
      unchanged: []
    });
    expect(
      ctx.projectReportService.createEventReportFolder
    ).not.toHaveBeenCalled();
    expect(
      ctx.testEventRepositoryService.listFileReports
    ).not.toHaveBeenCalled();
  });

  it('buildEvents() creates report folder, adds recording, and creates full report for each input', async () => {
    const ctx = build();
    const variables = [{ name: 'DLV - x', type: 'v' }] as never;
    const result = await ctx.service.buildEvents(
      'demo',
      [
        pageViewInput,
        {
          eventName: 'add_to_cart',
          testName: 'tag-b',
          recording: { title: 'add_to_cart', steps: [] },
          spec: { tag: {}, trigger: [] } as never
        }
      ],
      variables
    );
    expect(result.created).toEqual(['tag-a', 'tag-b']);
    expect(
      ctx.dataLayerSpecBuilderService.buildDataLayerSpec
    ).toHaveBeenCalledWith(pageViewInput.spec, variables);
    expect(
      ctx.projectReportService.createEventReportFolder
    ).toHaveBeenCalledTimes(2);
    expect(ctx.projectRecordingService.addRecording).toHaveBeenCalledTimes(2);
    expect(
      ctx.testReportFacadeRepositoryService.createFullReport
    ).toHaveBeenCalledTimes(2);
    const lastCall =
      ctx.testReportFacadeRepositoryService.createFullReport.mock.calls.at(-1);
    expect(lastCall?.[0]).toBe('demo');
    expect(lastCall?.[2]).toMatchObject({
      reportDetails: expect.objectContaining({
        eventName: 'add_to_cart',
        passed: false,
        requestPassed: false
      }),
      dataLayerSpec: { event: 'page_view' }
    });
  });

  it('buildEvents() refreshes the generated spec of an event the tag already has', async () => {
    const existing = {
      eventId: 'e-1',
      testName: 'tag-a',
      eventName: 'page_view',
      spec: { dataLayerSpec: { event: 'page_view' }, rawGtmTag: {} }
    };
    const ctx = build([existing]);

    const result = await ctx.service.buildEvents('demo', [pageViewInput]);

    expect(result).toEqual({ created: [], updated: ['tag-a'], unchanged: [] });
    expect(ctx.specRepositoryService.update).toHaveBeenCalledWith(
      'demo',
      'e-1',
      {
        event: 'page_view',
        dataLayerSpec: { event: 'page_view' },
        rawGtmTag: pageViewInput.spec
      }
    );
    expect(
      ctx.testReportFacadeRepositoryService.createFullReport
    ).not.toHaveBeenCalled();
  });

  it('buildEvents() keeps an edited spec of an event the tag already has', async () => {
    const ctx = build([
      {
        eventId: 'e-1',
        testName: 'tag-a',
        eventName: 'page_view',
        spec: { dataLayerSpec: { event: 'page_view', page: '/home' } }
      }
    ]);
    ctx.dataLayerSpecBuilderService.isGeneratedDataLayerSpec.mockReturnValue(
      false
    );

    const result = await ctx.service.buildEvents('demo', [pageViewInput]);

    expect(result).toEqual({ created: [], updated: [], unchanged: ['tag-a'] });
    expect(ctx.specRepositoryService.update).not.toHaveBeenCalled();
  });

  it('buildEvents() rethrows when downstream createFullReport fails', async () => {
    const ctx = build();
    ctx.testReportFacadeRepositoryService.createFullReport.mockRejectedValue(
      new Error('boom')
    );
    await expect(
      ctx.service.buildEvents('demo', [pageViewInput])
    ).rejects.toThrow('boom');
  });

  describe('refreshGeneratedSpec()', () => {
    const stored = {
      dataLayerSpec: { event: 'add_to_cart', ecommerce: { promo: '{{JS}}' } },
      rawGtmTag: { tag: {}, trigger: [] } as never
    };

    it('persists and returns the rebuilt spec of an unedited legacy spec', async () => {
      const ctx = build();
      const container = {
        containerVersion: {
          variable: [{ name: 'DLV', type: 'v' }],
          builtInVariable: [{ name: 'Event', type: 'EVENT' }]
        }
      };
      ctx.projectGtmContainerService.read.mockResolvedValue(container);
      ctx.dataLayerSpecBuilderService.upgradeLegacyDataLayerSpec.mockReturnValue(
        { event: 'add_to_cart' }
      );

      await expect(
        ctx.service.refreshGeneratedSpec('demo', 'e-1', stored as never)
      ).resolves.toEqual({ event: 'add_to_cart' });
      expect(
        ctx.dataLayerSpecBuilderService.upgradeLegacyDataLayerSpec
      ).toHaveBeenCalledWith(stored.dataLayerSpec, stored.rawGtmTag, [
        ...container.containerVersion.variable,
        ...container.containerVersion.builtInVariable
      ]);
      expect(ctx.specRepositoryService.update).toHaveBeenCalledWith(
        'demo',
        'e-1',
        { event: 'add_to_cart', dataLayerSpec: { event: 'add_to_cart' } }
      );
    });

    it('returns the stored spec unchanged when there is nothing to upgrade', async () => {
      const ctx = build();
      await expect(
        ctx.service.refreshGeneratedSpec('demo', 'e-1', stored as never)
      ).resolves.toBe(stored.dataLayerSpec);
      expect(ctx.specRepositoryService.update).not.toHaveBeenCalled();
    });
  });
});
