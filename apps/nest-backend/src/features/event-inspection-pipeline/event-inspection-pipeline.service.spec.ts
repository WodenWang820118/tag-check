import { describe, it, expect, vi } from 'vitest';
import type { StepFallback } from '@utils';
import { EventInspectionPipelineService } from './event-inspection-pipeline.service';
import { InspectorSingleEventService } from '../../features/inspector/inspector-single-event.service';
import { TestImageRepositoryService } from '../../core/repository/test-event/test-image-repository.service';
import { TestEventDetailRepositoryService } from '../../core/repository/test-event/test-event-detail-repository.service';
import { TestEventRepositoryService } from '../../core/repository/test-event/test-event-repository.service';
import { RunMedia } from './run-media';
import { StepElementNotFoundError } from '../web-agent/action/step-failure/step-element-not-found.error';

describe('EventInspectionPipelineService', () => {
  function build(opts?: { inspectError?: Error; inspectResult?: unknown }) {
    const inspectResult = opts?.inspectResult ?? {
      dataLayerResult: {
        passed: true,
        dataLayer: [{ event: 'view' }],
        message: 'ok'
      },
      destinationUrl: 'https://x',
      rawRequest: 'r',
      requestCheckResult: { passed: true }
    };
    const inspector = {
      inspectDataLayer: vi.fn(async () => {
        if (opts?.inspectError) throw opts.inspectError;
        return inspectResult;
      })
    } as unknown as InspectorSingleEventService;
    const testEventRepository = {
      getEntityBySlugAndEventId: vi.fn().mockResolvedValue({ id: 1 }),
      updateTestEvent: vi.fn().mockResolvedValue({ id: 1 })
    } as unknown as TestEventRepositoryService;
    const testEventDetailRepository = {
      create: vi.fn().mockResolvedValue({ id: 7, message: '' })
    } as unknown as TestEventDetailRepositoryService;
    const testImageRepository = {
      create: vi.fn().mockResolvedValue({ id: 9 })
    } as unknown as TestImageRepositoryService;
    const runTimeline = {
      steps: vi.fn().mockReturnValue([10_000, undefined, 19_000])
    };
    const runStepFallback = {
      fallbacks: vi.fn().mockReturnValue([] as StepFallback[])
    };
    const runRecordings = {
      prune: vi.fn().mockResolvedValue(undefined),
      saveStepFailure: vi.fn().mockResolvedValue(true)
    };
    return {
      svc: new EventInspectionPipelineService(
        inspector,
        testEventRepository,
        testEventDetailRepository,
        testImageRepository,
        runTimeline as never,
        runStepFallback as never,
        runRecordings as never
      ),
      runTimeline,
      runStepFallback,
      runRecordings,
      inspector,
      testEventRepository,
      testEventDetailRepository,
      testImageRepository
    };
  }

  it('persists detail/image and updates the test event on success', async () => {
    const {
      svc,
      testEventDetailRepository,
      testImageRepository,
      testEventRepository
    } = build();
    const page = {
      screenshot: vi.fn().mockResolvedValue(Buffer.from('img'))
    } as never;
    const preset = { application: undefined } as never;

    const result = await svc.singleEventInspectionRecipe(
      page,
      'p',
      'e',
      'M',
      { username: '', password: '' },
      'false',
      preset
    );

    expect(result).toBeDefined();
    expect(result?.[0].destinationUrl).toBe('https://x');
    expect(testEventDetailRepository.create).toHaveBeenCalled();
    expect(testImageRepository.create).toHaveBeenCalled();
    expect(testEventRepository.updateTestEvent).toHaveBeenCalled();
  });

  it('saves the run with its recordings, step timeline and request message, then prunes older recordings', async () => {
    const { svc, testEventDetailRepository, runTimeline, runRecordings } =
      build({
        inspectResult: {
          dataLayerResult: { passed: true, dataLayer: [], message: 'Valid' },
          destinationUrl: 'https://x',
          rawRequest: 'r',
          requestCheckResult: {
            passed: false,
            message: 'No GA4 request for add_to_cart was captured'
          }
        }
      });
    const page = {
      screenshot: vi.fn().mockResolvedValue(Buffer.from('img'))
    } as never;
    const media = new RunMedia();
    media.site = { firstFrameAt: 8_000 } as never;
    media.tagAssistant = { firstFrameAt: 8_400 } as never;

    await svc.singleEventInspectionRecipe(
      page,
      'p',
      'e',
      'M',
      { username: '', password: '' },
      'true',
      { application: undefined } as never,
      media
    );

    expect(runTimeline.steps).toHaveBeenCalledWith('e');
    expect(
      vi.mocked(testEventDetailRepository.create).mock.calls[0][1]
    ).toMatchObject({
      message: 'Valid',
      requestMessage: 'No GA4 request for add_to_cart was captured',
      recordingKey: media.recordingKey,
      mediaTimeline: {
        steps: [
          { index: 0, atMs: 2000 },
          { index: 2, atMs: 11000 }
        ],
        tagAssistantOffsetMs: 400
      }
    });
    expect(runRecordings.prune).toHaveBeenCalledWith('p', 'e', 1);
  });

  it('saves a run without recordings when its site recording did not start', async () => {
    const { svc, testEventDetailRepository, runRecordings } = build();
    const page = {
      screenshot: vi.fn().mockResolvedValue(Buffer.from('img'))
    } as never;

    await svc.singleEventInspectionRecipe(
      page,
      'p',
      'e',
      'M',
      { username: '', password: '' },
      'false',
      { application: undefined } as never,
      new RunMedia()
    );

    expect(
      vi.mocked(testEventDetailRepository.create).mock.calls[0][1]
    ).toMatchObject({ recordingKey: null, mediaTimeline: null });
    expect(runRecordings.prune).not.toHaveBeenCalled();
  });

  it('records a fallback failed detail when inspectDataLayer throws', async () => {
    const { svc, testEventDetailRepository } = build({
      inspectError: new Error('boom')
    });
    const page = {
      screenshot: vi.fn().mockResolvedValue(Buffer.from('img'))
    } as never;

    await svc.singleEventInspectionRecipe(
      page,
      'p',
      'e',
      'M',
      { username: '', password: '' },
      'false',
      { application: undefined } as never
    );

    const dto = (testEventDetailRepository.create as ReturnType<typeof vi.fn>)
      .mock.calls[0][1];
    expect(dto.passed).toBe(false);
    expect(dto.requestPassed).toBe(false);
    expect(dto.dataLayer).toEqual([]);
  });

  describe('a step that could not find its element', () => {
    function failure(withContext: boolean) {
      const error = new StepElementNotFoundError(
        'Failed to click',
        ['aria/Add to cart', '#add'],
        15000
      );
      error.stepIndex = 3;
      error.context = withContext
        ? ({ stepIndex: 3, stepType: 'click' } as never)
        : null;
      return error;
    }

    async function run(error: Error, media: RunMedia | null) {
      const built = build({ inspectError: error });
      const page = {
        screenshot: vi.fn().mockResolvedValue(Buffer.from('img'))
      } as never;
      await built.svc.singleEventInspectionRecipe(
        page,
        'p',
        'e',
        'M',
        { username: '', password: '' },
        'false',
        { application: undefined } as never,
        media
      );
      const dto = vi.mocked(built.testEventDetailRepository.create).mock
        .calls[0][1];
      return { ...built, dto };
    }

    it('names the step and keeps what it saw beside the recordings', async () => {
      const error = failure(true);
      const media = new RunMedia();
      media.site = { firstFrameAt: 8_000 } as never;

      const { dto, runRecordings } = await run(error, media);

      expect(dto.message).toBe(
        'Step 4 (click) could not find its element: none of its 2 selectors appeared within 15 s.'
      );
      expect(runRecordings.saveStepFailure).toHaveBeenCalledWith(
        'p',
        'e',
        media.recordingKey,
        error.context
      );
    });

    it('names the step without its type when the page could not be read', async () => {
      const { dto, runRecordings } = await run(failure(false), null);

      expect(dto.message).toBe(
        'Step 4 could not find its element: none of its 2 selectors appeared within 15 s.'
      );
      expect(runRecordings.saveStepFailure).not.toHaveBeenCalled();
    });

    it('keeps nothing for a run without recordings', async () => {
      const { runRecordings } = await run(failure(true), new RunMedia());

      expect(runRecordings.saveStepFailure).not.toHaveBeenCalled();
    });
  });

  it('saves one result when saving a finished run fails, and rejects', async () => {
    const { svc, testEventDetailRepository, testEventRepository } = build();
    vi.mocked(testEventRepository.updateTestEvent).mockRejectedValueOnce(
      new Error('database is locked')
    );
    const page = {
      screenshot: vi.fn().mockResolvedValue(Buffer.from('img'))
    } as never;

    await expect(
      svc.singleEventInspectionRecipe(
        page,
        'p',
        'e',
        'M',
        { username: '', password: '' },
        'false',
        { application: undefined } as never
      )
    ).rejects.toThrow('database is locked');
    expect(testEventDetailRepository.create).toHaveBeenCalledTimes(1);
    expect(
      vi.mocked(testEventDetailRepository.create).mock.calls[0][1].passed
    ).toBe(true);
  });

  it("rejects with the run's error when the failed run cannot be saved", async () => {
    const { svc, testEventDetailRepository } = build({
      inspectError: new Error('Failed to find any of the specified selectors')
    });
    const page = {
      screenshot: vi.fn().mockRejectedValue(new Error('Target closed'))
    } as never;

    await expect(
      svc.singleEventInspectionRecipe(
        page,
        'p',
        'e',
        'M',
        { username: '', password: '' },
        'false',
        { application: undefined } as never
      )
    ).rejects.toThrow('Failed to find any of the specified selectors');
    expect(testEventDetailRepository.create).not.toHaveBeenCalled();
  });

  it('saves a run without a request check as request not passed', async () => {
    const { svc, testEventDetailRepository } = build({
      inspectResult: {
        dataLayerResult: { passed: true, dataLayer: [], message: 'ok' },
        destinationUrl: 'https://x',
        rawRequest: '',
        requestCheckResult: null
      }
    });
    const page = {
      screenshot: vi.fn().mockResolvedValue(Buffer.from('img'))
    } as never;

    await svc.singleEventInspectionRecipe(
      page,
      'p',
      'e',
      'M',
      { username: '', password: '' },
      'false',
      { application: undefined } as never
    );

    expect(
      vi.mocked(testEventDetailRepository.create).mock.calls[0][1]
    ).toMatchObject({ passed: true, requestPassed: false });
  });

  describe('a fallback selector', () => {
    const preset = { application: undefined } as never;
    const page = {
      screenshot: vi.fn().mockResolvedValue(Buffer.from('img'))
    } as never;
    const inspectResult = {
      dataLayerResult: { passed: true, dataLayer: [], message: 'Valid' },
      destinationUrl: 'https://x',
      rawRequest: 'r',
      requestCheckResult: null
    };

    it('adds one sentence per fallback the run recorded', async () => {
      const { svc, testEventDetailRepository, runStepFallback } = build({
        inspectResult
      });
      runStepFallback.fallbacks.mockReturnValue([
        {
          stepIndex: 4,
          stepType: 'click',
          selector: '[data-testid="add-to-cart"]',
          matchedBy: 'testId',
          value: 'add-to-cart'
        },
        {
          stepIndex: 1,
          stepType: 'change',
          selector: '#qty',
          matchedBy: 'id',
          value: 'qty'
        }
      ]);

      await svc.singleEventInspectionRecipe(
        page,
        'p',
        'e',
        'M',
        { username: '', password: '' },
        'false',
        preset
      );

      expect(runStepFallback.fallbacks).toHaveBeenCalledWith('e');
      expect(
        vi.mocked(testEventDetailRepository.create).mock.calls[0][1].message
      ).toBe(
        'Valid. Step 5 (click) used a fallback selector [data-testid="add-to-cart"]: its recorded selectors found nothing, and one element matched the recorded test hook "add-to-cart". Step 2 (change) used a fallback selector #qty: its recorded selectors found nothing, and one element matched the recorded id "qty".'
      );
    });

    it('leaves the message unchanged when the run used no fallback', async () => {
      const { svc, testEventDetailRepository, runStepFallback } = build({
        inspectResult
      });

      await svc.singleEventInspectionRecipe(
        page,
        'p',
        'e',
        'M',
        { username: '', password: '' },
        'false',
        preset
      );

      expect(runStepFallback.fallbacks).toHaveBeenCalledWith('e');
      expect(
        vi.mocked(testEventDetailRepository.create).mock.calls[0][1].message
      ).toBe('Valid');
    });
  });
});
