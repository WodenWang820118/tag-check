import { plainToInstance } from 'class-transformer';
import { describe, expect, it, vi } from 'vitest';
import { REPORT_DETAIL_SAMPLE } from '@utils';
import {
  AbstractTestEventResponseDto,
  TestEventDetailResponseDto,
  TestImageResponseDto
} from '../../../shared';
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
    /** The repositories' DTOs, built from entity-shaped rows as they are at runtime. */
    function stubRepositories(ctx: ReturnType<typeof build>) {
      const detailEntity = {
        ...REPORT_DETAIL_SAMPLE.testEventDetails,
        testEvent: { id: 3 }
      };
      ctx.testEventRepositoryService.getBySlugAndEventId.mockResolvedValue(
        plainToInstance(AbstractTestEventResponseDto, {
          ...REPORT_DETAIL_SAMPLE.testEvent,
          project: { projectSlug: 'demo' },
          testEventDetails: [detailEntity],
          testImage: [],
          latestTestEventDetailId: detailEntity.id
        })
      );
      ctx.testEventDetailRepositoryService.getBySlugAndEventId.mockResolvedValue(
        plainToInstance(TestEventDetailResponseDto, detailEntity)
      );
      ctx.testImageRepositoryService.getBySlugAndEventId.mockResolvedValue(
        plainToInstance(TestImageResponseDto, {
          ...REPORT_DETAIL_SAMPLE.testImage,
          imageData: Buffer.from('png bytes'),
          testEvent: { id: 3 }
        })
      );
    }

    const wire = (value: unknown) => JSON.parse(JSON.stringify(value));
    const keysOf = (value: object) => Object.keys(value).sort();

    it('sends the fields of the recorded contract sample', async () => {
      const ctx = build();
      stubRepositories(ctx);

      const body = wire(await ctx.service.getReportDetail('demo', 'evt'));

      expect(keysOf(body)).toEqual(keysOf(REPORT_DETAIL_SAMPLE));
      expect(keysOf(body.testEvent)).toEqual(
        keysOf(REPORT_DETAIL_SAMPLE.testEvent)
      );
      expect(keysOf(body.testEventDetails)).toEqual(
        keysOf(REPORT_DETAIL_SAMPLE.testEventDetails)
      );
      expect(keysOf(body.testImage)).toEqual(
        keysOf(REPORT_DETAIL_SAMPLE.testImage)
      );
    });

    it('leaves the screenshot bytes out; GET /projects/images serves them', async () => {
      const ctx = build();
      stubRepositories(ctx);

      const result = await ctx.service.getReportDetail('demo', 'evt');

      expect(result.testImage).not.toHaveProperty('imageData');
      expect(result.testImage?.imageSize).toBe(
        REPORT_DETAIL_SAMPLE.testImage.imageSize
      );
    });

    it('sends null result and screenshot before the first run', async () => {
      const ctx = build();
      ctx.testEventRepositoryService.getBySlugAndEventId.mockResolvedValue({
        id: 1
      });
      ctx.testEventDetailRepositoryService.getBySlugAndEventId.mockResolvedValue(
        null
      );
      ctx.testImageRepositoryService.getBySlugAndEventId.mockResolvedValue(
        null
      );

      const result = await ctx.service.getReportDetail('demo', 'evt');

      expect(result).toEqual({
        testEvent: { id: 1 },
        testEventDetails: null,
        testImage: null
      });
    });
  });
});
