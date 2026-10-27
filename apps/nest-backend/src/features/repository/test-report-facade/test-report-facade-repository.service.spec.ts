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
    getBySlugAndEventId: vi.fn(),
    deleteByProjectSlugAndEventIds: vi.fn()
  };
  const testEventDetailRepositoryService = {
    create: vi.fn(),
    getBySlugAndEventId: vi.fn(),
    getRunScreenshot: vi.fn(),
    listRunHistory: vi.fn().mockResolvedValue([])
  };
  const specRepositoryService = { create: vi.fn() };
  const testImageRepositoryService = {
    getBySlugAndEventId: vi.fn(),
    getSummaryBySlugAndEventId: vi.fn()
  };
  const recordingRepositoryService = { create: vi.fn() };
  const itemDefRepositoryService = { create: vi.fn() };
  const runRecordingsService = {
    fileOf: vi.fn().mockResolvedValue(null),
    readStepFailure: vi.fn().mockResolvedValue(null),
    removeTests: vi.fn().mockResolvedValue(undefined)
  };
  const service = new TestReportFacadeRepositoryService(
    projectRepositoryService as never,
    testEventRepositoryService as never,
    testEventDetailRepositoryService as never,
    specRepositoryService as never,
    testImageRepositoryService as never,
    recordingRepositoryService as never,
    itemDefRepositoryService as never,
    runRecordingsService as never
  );
  return {
    service,
    runRecordingsService,
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
      ctx.testEventDetailRepositoryService.listRunHistory.mockResolvedValue(
        REPORT_DETAIL_SAMPLE.runs.map(({ hasRecording, ...run }) => ({
          ...run,
          runAt: new Date(run.runAt),
          recordingKey: hasRecording
            ? '0f0e6b2a-7c1d-4e5f-8a9b-1c2d3e4f5a6b'
            : null
        }))
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
        testImage: null,
        runs: [],
        stepFailure: null
      });
    });

    it("reads the chosen run and that run's screenshot", async () => {
      const ctx = build();
      stubRepositories(ctx);
      ctx.testEventDetailRepositoryService.getRunScreenshot.mockResolvedValue({
        id: 5,
        imageName: 'screenshot.png'
      });

      const result = await ctx.service.getReportDetail('demo', 'evt', 5);

      expect(
        ctx.testEventDetailRepositoryService.getBySlugAndEventId
      ).toHaveBeenCalledWith('demo', 'evt', 5);
      expect(
        ctx.testEventDetailRepositoryService.getRunScreenshot
      ).toHaveBeenCalledWith('demo', 'evt', 5);
      expect(
        ctx.testImageRepositoryService.getSummaryBySlugAndEventId
      ).not.toHaveBeenCalled();
      expect(result.testImage).toMatchObject({ id: 5 });
    });

    it('lists the runs, newest first, and which kept their recordings', async () => {
      const ctx = build();
      stubRepositories(ctx);
      ctx.testEventDetailRepositoryService.listRunHistory.mockResolvedValue([
        {
          runId: 9,
          passed: true,
          requestPassed: true,
          runAt: new Date(0),
          recordingKey: null
        },
        {
          runId: 8,
          passed: true,
          requestPassed: false,
          runAt: new Date(0),
          recordingKey: null
        },
        {
          runId: 7,
          passed: false,
          requestPassed: false,
          runAt: new Date(0),
          recordingKey: 'key'
        }
      ]);
      // Only the latest run can own recordings left in the test's folder.
      ctx.runRecordingsService.fileOf.mockResolvedValue('recording.webm');

      const result = await ctx.service.getReportDetail('demo', 'evt');

      expect(result.runs.map((run) => [run.runId, run.hasRecording])).toEqual([
        [9, true],
        [8, false],
        [7, true]
      ]);
      expect(ctx.runRecordingsService.fileOf).toHaveBeenCalledTimes(1);
    });
  });

  describe('getReportDetail() step failure', () => {
    const KEY = '0f0e6b2a-7c1d-4e5f-8a9b-1c2d3e4f5a6b';

    function setUp(readStepFailure: (...args: unknown[]) => Promise<unknown>) {
      const ctx = build();
      ctx.runRecordingsService.readStepFailure.mockImplementation(
        readStepFailure
      );
      ctx.testEventRepositoryService.getBySlugAndEventId.mockResolvedValue(
        REPORT_DETAIL_SAMPLE.testEvent
      );
      ctx.testEventDetailRepositoryService.getBySlugAndEventId.mockResolvedValue(
        { ...REPORT_DETAIL_SAMPLE.testEventDetails, id: 7 }
      );
      ctx.testEventDetailRepositoryService.listRunHistory.mockResolvedValue([
        {
          runId: 7,
          passed: false,
          requestPassed: false,
          runAt: new Date(0),
          recordingKey: KEY
        }
      ]);
      return ctx;
    }

    it('says which step of the shown run could not find its element', async () => {
      const ctx = setUp(
        vi.fn().mockResolvedValue({
          stepIndex: 4,
          stepType: 'click',
          url: 'https://shop.example/',
          candidates: []
        })
      );

      const result = await ctx.service.getReportDetail('demo', 'evt');

      expect(result.stepFailure).toEqual({
        stepIndex: 4,
        stepType: 'click',
        url: 'https://shop.example/'
      });
      expect(ctx.runRecordingsService.readStepFailure).toHaveBeenCalledWith(
        'demo',
        'evt',
        KEY
      );
    });

    it('is null when the run kept none, or it cannot be read', async () => {
      expect(
        (
          await setUp(vi.fn().mockResolvedValue(null)).service.getReportDetail(
            'demo',
            'evt'
          )
        ).stepFailure
      ).toBeNull();
      expect(
        (
          await setUp(
            vi.fn().mockRejectedValue(new SyntaxError('Unexpected end of JSON'))
          ).service.getReportDetail('demo', 'evt')
        ).stepFailure
      ).toBeNull();
    });
  });

  describe('deleteTests()', () => {
    it('deletes the tests, then what their runs left on disk', async () => {
      const ctx = build();
      ctx.testEventRepositoryService.deleteByProjectSlugAndEventIds.mockResolvedValue(
        [{ eventId: 'evt-1' }, { eventId: 'evt-2' }]
      );

      const result = await ctx.service.deleteTests('demo', [
        'evt-1',
        'evt-2',
        'other-project'
      ]);

      expect(ctx.runRecordingsService.removeTests).toHaveBeenCalledWith(
        'demo',
        ['evt-1', 'evt-2']
      );
      expect(result).toEqual([{ eventId: 'evt-1' }, { eventId: 'evt-2' }]);
    });
  });
});
