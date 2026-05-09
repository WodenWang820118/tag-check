import { describe, expect, it, vi } from 'vitest';
import { TestReportFacadeRepositoryService } from './test-report-facade-repository.service';

function build() {
  const projectRepositoryService = { getEntityBySlug: vi.fn() };
  const testEventRepositoryService = {
    create: vi.fn(),
    getEntityByEventId: vi.fn(),
    getBySlugAndEventId: vi.fn()
  };
  const testEventDetailRepositoryService = {
    create: vi.fn(),
    getBySlugAndEventId: vi.fn()
  };
  const specRepositoryService = { create: vi.fn() };
  const testImageRepositoryService = { getBySlugAndEventId: vi.fn() };
  const recordingRepositoryService = { create: vi.fn() };
  const itemDefRepositoryService = { create: vi.fn() };
  const service = new TestReportFacadeRepositoryService(
    projectRepositoryService as never,
    testEventRepositoryService as never,
    testEventDetailRepositoryService as never,
    specRepositoryService as never,
    testImageRepositoryService as never,
    recordingRepositoryService as never,
    itemDefRepositoryService as never
  );
  return {
    service,
    projectRepositoryService,
    testEventRepositoryService,
    testEventDetailRepositoryService,
    specRepositoryService,
    testImageRepositoryService,
    recordingRepositoryService,
    itemDefRepositoryService
  };
}

describe('TestReportFacadeRepositoryService', () => {
  describe('createAbstractReport()', () => {
    it('creates the test event, then a detail/recording/spec; skips item def when fullItemDef is missing', async () => {
      const ctx = build();
      ctx.projectRepositoryService.getEntityBySlug.mockResolvedValue({ id: 1 });
      ctx.testEventRepositoryService.create.mockResolvedValue({});
      ctx.testEventRepositoryService.getEntityByEventId.mockResolvedValue({
        id: 7
      });
      ctx.testEventDetailRepositoryService.create.mockResolvedValue({});
      ctx.recordingRepositoryService.create.mockResolvedValue({});
      ctx.specRepositoryService.create.mockResolvedValue({});

      await ctx.service.createAbstractReport('demo', 'evt', {
        eventId: 'evt',
        eventName: 'page_view',
        testName: 'test',
        message: 'm',
        dataLayerSpec: {},
        rawGtmTag: 'tag'
      } as never);

      expect(ctx.testEventRepositoryService.create).toHaveBeenCalledWith(
        { id: 1 },
        expect.objectContaining({ eventId: 'evt', eventName: 'page_view' })
      );
      expect(ctx.testEventDetailRepositoryService.create).toHaveBeenCalledWith(
        { id: 7 },
        expect.objectContaining({ passed: false, requestPassed: false })
      );
      expect(ctx.recordingRepositoryService.create).toHaveBeenCalledWith(
        { id: 7 },
        { title: 'page_view', steps: [] }
      );
      expect(ctx.specRepositoryService.create).toHaveBeenCalledWith(
        { id: 7 },
        expect.objectContaining({ event: 'page_view' })
      );
      expect(ctx.itemDefRepositoryService.create).not.toHaveBeenCalled();
    });

    it('also creates the item def when fullItemDef is provided', async () => {
      const ctx = build();
      ctx.projectRepositoryService.getEntityBySlug.mockResolvedValue({ id: 1 });
      ctx.testEventRepositoryService.create.mockResolvedValue({});
      ctx.testEventRepositoryService.getEntityByEventId.mockResolvedValue({
        id: 7
      });
      ctx.testEventDetailRepositoryService.create.mockResolvedValue({});
      ctx.recordingRepositoryService.create.mockResolvedValue({});
      ctx.specRepositoryService.create.mockResolvedValue({});
      ctx.itemDefRepositoryService.create.mockResolvedValue({});

      await ctx.service.createAbstractReport('demo', 'evt', {
        eventId: 'evt',
        eventName: 'add_to_cart',
        testName: 'test',
        message: 'm',
        dataLayerSpec: {},
        rawGtmTag: 'tag',
        fullItemDef: 'def',
        templateName: 'tpl',
        itemId: 'iid'
      } as never);

      expect(ctx.itemDefRepositoryService.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('createFullReport()', () => {
    it('creates test event, recording, spec, and (optionally) item def, then re-fetches the full event', async () => {
      const ctx = build();
      ctx.projectRepositoryService.getEntityBySlug.mockResolvedValue({ id: 1 });
      ctx.testEventRepositoryService.create.mockResolvedValue({});
      ctx.testEventRepositoryService.getEntityByEventId.mockResolvedValue({
        id: 7
      });
      ctx.recordingRepositoryService.create.mockResolvedValue({});
      ctx.specRepositoryService.create.mockResolvedValue({});
      ctx.itemDefRepositoryService.create.mockResolvedValue({});
      ctx.testEventRepositoryService.getBySlugAndEventId.mockResolvedValue({
        id: 7
      });

      const result = await ctx.service.createFullReport('demo', 'evt', {
        reportDetails: {
          eventId: 'evt',
          eventName: 'add_to_cart',
          testName: 't',
          message: 'm'
        },
        recording: { steps: [{ type: 'click' }] },
        dataLayerSpec: {},
        spec: 'rawTag',
        fullItemDef: { fullItemDef: 'd', itemId: 'iid', templateName: 'tpl' }
      } as never);

      expect(ctx.recordingRepositoryService.create).toHaveBeenCalledWith(
        { id: 7 },
        { title: 'add_to_cart', steps: [{ type: 'click' }] }
      );
      expect(ctx.itemDefRepositoryService.create).toHaveBeenCalledWith(
        { id: 7 },
        { fullItemDef: 'd', itemId: 'iid', templateName: 'tpl' }
      );
      expect(result).toEqual({ id: 7 });
    });

    it('rethrows downstream failures', async () => {
      const ctx = build();
      ctx.projectRepositoryService.getEntityBySlug.mockRejectedValue(
        new Error('db')
      );
      await expect(
        ctx.service.createFullReport('demo', 'evt', {
          reportDetails: {
            eventId: 'evt',
            eventName: 'x',
            testName: 't',
            message: 'm'
          },
          recording: {},
          dataLayerSpec: {},
          spec: ''
        } as never)
      ).rejects.toThrow('db');
    });
  });

  describe('getReportDetail()', () => {
    it('aggregates testEvent, testEventDetails and testImage by slug+eventId', async () => {
      const ctx = build();
      ctx.testEventRepositoryService.getBySlugAndEventId.mockResolvedValue({
        id: 1
      });
      ctx.testEventDetailRepositoryService.getBySlugAndEventId.mockResolvedValue(
        { id: 2 }
      );
      ctx.testImageRepositoryService.getBySlugAndEventId.mockResolvedValue({
        id: 3
      });
      const result = await ctx.service.getReportDetail('demo', 'evt');
      expect(result).toEqual({
        testEvent: { id: 1 },
        testEventDetails: { id: 2 },
        testImage: { id: 3 }
      });
    });
  });
});
