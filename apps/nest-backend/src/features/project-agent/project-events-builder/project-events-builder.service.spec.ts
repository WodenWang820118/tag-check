import { describe, expect, it, vi } from 'vitest';
import { ConflictException } from '@nestjs/common';
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
    listWithSpecs: vi.fn().mockResolvedValue(existingEvents),
    update: vi.fn()
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

const noChanges = {
  created: [],
  updated: [],
  unchanged: [],
  renamed: [],
  keptBoth: []
};

describe('ProjectEventsBuilderService', () => {
  it('buildEvents() short-circuits with no inputs', async () => {
    const ctx = build();
    await expect(ctx.service.buildEvents('demo', [])).resolves.toEqual(
      noChanges
    );
    expect(
      ctx.projectReportService.createEventReportFolder
    ).not.toHaveBeenCalled();
    expect(ctx.testEventRepositoryService.listWithSpecs).not.toHaveBeenCalled();
  });

  it('findImportConflicts() returns preview conflicts and performs no writes', async () => {
    const existing = {
      id: 7,
      eventId: 'e-1',
      testName: 'X',
      eventName: 'purchase',
      spec: {
        dataLayerSpec: { event: 'purchase', page: '/edited' },
        rawGtmTag: { tag: { name: 'X' }, trigger: [] }
      }
    };
    const ctx = build([existing]);
    ctx.dataLayerSpecBuilderService.isGeneratedDataLayerSpec.mockReturnValue(
      false
    );
    const input = {
      ...pageViewInput,
      testName: 'X',
      eventName: 'begin_checkout'
    };

    const conflicts = await ctx.service.findImportConflicts('demo', [input]);

    expect(conflicts).toEqual([
      {
        tagName: 'X',
        existingEventName: 'purchase',
        newEventName: 'begin_checkout',
        specEdited: true
      }
    ]);
    expect(ctx.testEventRepositoryService.listWithSpecs).toHaveBeenCalledWith(
      'demo'
    );
    expect(ctx.testEventRepositoryService.update).not.toHaveBeenCalled();
    expect(ctx.specRepositoryService.update).not.toHaveBeenCalled();
    expect(ctx.projectRecordingService.addRecording).not.toHaveBeenCalled();
    expect(
      ctx.testReportFacadeRepositoryService.createFullReport
    ).not.toHaveBeenCalled();
    expect(
      ctx.projectReportService.createEventReportFolder
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

    expect(result).toEqual({ ...noChanges, updated: ['tag-a'] });
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

    expect(result).toEqual({ ...noChanges, unchanged: ['tag-a'] });
    expect(ctx.specRepositoryService.update).not.toHaveBeenCalled();
  });

  it('buildEvents() keeps the same event even when the resolution is keep both', async () => {
    const existing = {
      eventId: 'e-1',
      testName: 'tag-a',
      eventName: 'page_view',
      spec: { dataLayerSpec: { event: 'page_view' }, rawGtmTag: {} }
    };
    const ctx = build([existing]);

    await expect(
      ctx.service.findImportConflicts('demo', [pageViewInput])
    ).resolves.toEqual([]);
    const result = await ctx.service.buildEvents('demo', [pageViewInput], [], {
      'tag-a': 'keepBoth'
    });

    expect(result).toEqual({ ...noChanges, updated: ['tag-a'] });
    expect(
      ctx.testReportFacadeRepositoryService.createFullReport
    ).not.toHaveBeenCalled();
    expect(ctx.testEventRepositoryService.update).not.toHaveBeenCalled();
  });

  it('buildEvents() updates a renamed event and keeps its id, recording and runs', async () => {
    const existing = {
      id: 7,
      eventId: 'e-1',
      testName: 'X',
      eventName: 'purchase',
      spec: {
        dataLayerSpec: { event: 'purchase', page: '/edited' },
        rawGtmTag: { tag: { name: 'X' }, trigger: [] }
      }
    };
    const ctx = build([existing]);
    ctx.dataLayerSpecBuilderService.isGeneratedDataLayerSpec.mockReturnValue(
      false
    );
    const input = {
      ...pageViewInput,
      testName: 'X',
      eventName: 'begin_checkout'
    };

    await expect(
      ctx.service.findImportConflicts('demo', [input])
    ).resolves.toEqual([
      {
        tagName: 'X',
        existingEventName: 'purchase',
        newEventName: 'begin_checkout',
        specEdited: true
      }
    ]);
    const result = await ctx.service.buildEvents('demo', [input], [], {
      X: 'update'
    });

    expect(result).toEqual({ ...noChanges, renamed: ['X'] });
    expect(ctx.testEventRepositoryService.update).toHaveBeenCalledWith(7, {
      eventName: 'begin_checkout'
    });
    expect(ctx.specRepositoryService.update).toHaveBeenCalledWith(
      'demo',
      'e-1',
      {
        event: 'begin_checkout',
        dataLayerSpec: { event: 'page_view' },
        rawGtmTag: input.spec
      }
    );
    expect(ctx.projectRecordingService.addRecording).not.toHaveBeenCalled();
    expect(
      ctx.projectReportService.createEventReportFolder
    ).not.toHaveBeenCalled();
    expect(
      ctx.testReportFacadeRepositoryService.createFullReport
    ).not.toHaveBeenCalled();
  });

  it('buildEvents() keepBoth creates X (1), then X (2) on the next import', async () => {
    const existing = {
      id: 7,
      eventId: 'e-1',
      testName: 'X',
      eventName: 'purchase',
      spec: { dataLayerSpec: { event: 'purchase' }, rawGtmTag: {} }
    };
    const ctx = build([existing]);
    const input = {
      ...pageViewInput,
      testName: 'X',
      eventName: 'begin_checkout',
      recording: { title: 'begin_checkout', steps: [] }
    };

    const first = await ctx.service.buildEvents('demo', [input], [], {
      X: 'keepBoth'
    });

    expect(first.keptBoth).toEqual([{ tagName: 'X', testName: 'X (1)' }]);
    expect(first.created).toEqual([]);
    expect(ctx.testEventRepositoryService.update).not.toHaveBeenCalled();
    expect(ctx.specRepositoryService.update).not.toHaveBeenCalled();
    const calls =
      ctx.testReportFacadeRepositoryService.createFullReport.mock.calls;
    const created: unknown = calls[0]?.[2];
    expect(created).toMatchObject({
      reportDetails: {
        testName: 'X (1)',
        eventName: 'begin_checkout'
      },
      recording: input.recording
    });
    const createdId = readEventId(created);
    expect(createdId).not.toBe('e-1');
    expect(ctx.projectRecordingService.addRecording).toHaveBeenCalledWith(
      'demo',
      createdId,
      input.recording
    );

    ctx.testEventRepositoryService.listWithSpecs.mockResolvedValue([
      existing,
      {
        id: 8,
        eventId: createdId,
        testName: 'X (1)',
        eventName: 'begin_checkout',
        spec: {}
      }
    ]);
    const second = await ctx.service.buildEvents('demo', [input], [], {
      X: 'keepBoth'
    });
    expect(second.keptBoth).toEqual([{ tagName: 'X', testName: 'X (2)' }]);
  });

  it('buildEvents() keepBoth uses the lowest free suffix, including names from this import', async () => {
    const ctx = build([
      {
        id: 1,
        eventId: 'e-1',
        testName: 'X',
        eventName: 'purchase',
        spec: {}
      },
      {
        id: 2,
        eventId: 'e-2',
        testName: 'X (1)',
        eventName: 'older',
        spec: {}
      },
      {
        id: 3,
        eventId: 'e-3',
        testName: 'X (3)',
        eventName: 'older',
        spec: {}
      }
    ]);

    const gapped = await ctx.service.buildEvents(
      'demo',
      [{ ...pageViewInput, testName: 'X', eventName: 'begin_checkout' }],
      [],
      { X: 'keepBoth' }
    );
    expect(gapped.keptBoth).toEqual([{ tagName: 'X', testName: 'X (2)' }]);

    const fresh = build([
      {
        id: 1,
        eventId: 'e-1',
        testName: 'X',
        eventName: 'purchase',
        spec: {}
      }
    ]);
    const alongside = await fresh.service.buildEvents(
      'demo',
      [
        {
          ...pageViewInput,
          testName: 'X (1)',
          eventName: 'view_item'
        },
        {
          ...pageViewInput,
          testName: 'X',
          eventName: 'begin_checkout'
        }
      ],
      [],
      { X: 'keepBoth' }
    );
    expect(alongside.created).toEqual(['X (1)']);
    expect(alongside.keptBoth).toEqual([{ tagName: 'X', testName: 'X (2)' }]);
  });

  it('buildEvents() throws 409 and writes nothing when a conflict is unresolved', async () => {
    const ctx = build([
      {
        id: 7,
        eventId: 'e-1',
        testName: 'X',
        eventName: 'purchase',
        spec: { dataLayerSpec: { event: 'purchase' }, rawGtmTag: {} }
      }
    ]);
    const input = {
      ...pageViewInput,
      testName: 'X',
      eventName: 'begin_checkout'
    };

    let thrown: unknown;
    try {
      await ctx.service.buildEvents('demo', [input]);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ConflictException);
    if (thrown instanceof ConflictException) {
      expect(thrown.getStatus()).toBe(409);
      expect(thrown.getResponse()).toMatchObject({
        conflicts: [
          {
            tagName: 'X',
            existingEventName: 'purchase',
            newEventName: 'begin_checkout',
            specEdited: false
          }
        ]
      });
    }
    expect(ctx.testEventRepositoryService.update).not.toHaveBeenCalled();
    expect(ctx.specRepositoryService.update).not.toHaveBeenCalled();
    expect(ctx.projectRecordingService.addRecording).not.toHaveBeenCalled();
    expect(
      ctx.testReportFacadeRepositoryService.createFullReport
    ).not.toHaveBeenCalled();
    expect(
      ctx.projectReportService.createEventReportFolder
    ).not.toHaveBeenCalled();
  });

  it('buildEvents() throws 409 and writes nothing with unresolved conflicts', async () => {
    const existing = {
      id: 7,
      eventId: 'e-1',
      testName: 'X',
      eventName: 'purchase',
      spec: { dataLayerSpec: { event: 'purchase' }, rawGtmTag: {} }
    };
    const ctx = build([existing]);
    const conflictInput = {
      ...pageViewInput,
      testName: 'X',
      eventName: 'begin_checkout'
    };
    const cleanInput = {
      ...pageViewInput,
      testName: 'Y',
      eventName: 'view_item'
    };

    await expect(
      ctx.service.buildEvents('demo', [cleanInput, conflictInput])
    ).rejects.toBeInstanceOf(ConflictException);

    expect(ctx.testEventRepositoryService.update).not.toHaveBeenCalled();
    expect(ctx.specRepositoryService.update).not.toHaveBeenCalled();
    expect(ctx.projectRecordingService.addRecording).not.toHaveBeenCalled();
    expect(
      ctx.testReportFacadeRepositoryService.createFullReport
    ).not.toHaveBeenCalled();
    expect(
      ctx.projectReportService.createEventReportFolder
    ).not.toHaveBeenCalled();
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

function readEventId(report: unknown): string {
  if (!report || typeof report !== 'object' || !('reportDetails' in report)) {
    throw new Error('expected the created report');
  }
  const details = report.reportDetails;
  if (
    !details ||
    typeof details !== 'object' ||
    !('eventId' in details) ||
    typeof details.eventId !== 'string'
  ) {
    throw new Error('expected the created event id');
  }
  return details.eventId;
}
