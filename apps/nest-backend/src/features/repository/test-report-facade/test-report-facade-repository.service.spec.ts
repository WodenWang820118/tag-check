import { plainToInstance } from 'class-transformer';
import { describe, expect, it, vi } from 'vitest';
import { REPORT_DETAIL_SAMPLE, shapeOf } from '@utils';
import {
  AbstractTestEventResponseDto,
  TestEventDetailResponseDto
} from '../../../shared';
import { TestReportFacadeRepositoryService } from './test-report-facade-repository.service';

function build() {
  const projectRepositoryService = { getEntityBySlug: vi.fn() };
  const testEventRepositoryService = {
    create: vi.fn(),
    getEntityBySlugAndEventId: vi.fn(),
    getBySlugAndEventId: vi.fn()
  };
  const testEventDetailRepositoryService = {
    create: vi.fn(),
    getBySlugAndEventId: vi.fn()
  };
  const specRepositoryService = { create: vi.fn() };
  const testImageRepositoryService = {
    getBySlugAndEventId: vi.fn(),
    getSummaryBySlugAndEventId: vi.fn()
  };
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
  describe('createFullReport()', () => {
    it('creates test event, recording, spec, and (optionally) item def, then re-fetches the full event', async () => {
      const ctx = build();
      ctx.projectRepositoryService.getEntityBySlug.mockResolvedValue({ id: 1 });
      ctx.testEventRepositoryService.create.mockResolvedValue({});
      ctx.testEventRepositoryService.getEntityBySlugAndEventId.mockResolvedValue(
        {
          id: 7
        }
      );
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
      // Another project may hold a test with the same eventId.
      expect(
        ctx.testEventRepositoryService.getEntityBySlugAndEventId
      ).toHaveBeenCalledWith('demo', 'evt');
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
          latestTestEventDetailId: detailEntity.id,
          latestTestEventDetail: detailEntity
        })
      );
      ctx.testEventDetailRepositoryService.getBySlugAndEventId.mockResolvedValue(
        plainToInstance(TestEventDetailResponseDto, detailEntity)
      );
      ctx.testImageRepositoryService.getSummaryBySlugAndEventId.mockResolvedValue(
        REPORT_DETAIL_SAMPLE.testImage
      );
    }

    const wire = (value: unknown) => JSON.parse(JSON.stringify(value));

    it('sends the shape of the recorded contract sample', async () => {
      const ctx = build();
      stubRepositories(ctx);

      const body = wire(await ctx.service.getReportDetail('demo', 'evt'));

      expect(shapeOf(body)).toEqual(shapeOf(REPORT_DETAIL_SAMPLE));
    });

    it('reads the screenshot metadata, not its bytes; GET /projects/images serves them', async () => {
      const ctx = build();
      stubRepositories(ctx);

      const result = await ctx.service.getReportDetail('demo', 'evt');

      expect(
        ctx.testImageRepositoryService.getSummaryBySlugAndEventId
      ).toHaveBeenCalledWith('demo', 'evt');
      expect(
        ctx.testImageRepositoryService.getBySlugAndEventId
      ).not.toHaveBeenCalled();
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
      ctx.testImageRepositoryService.getSummaryBySlugAndEventId.mockResolvedValue(
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
