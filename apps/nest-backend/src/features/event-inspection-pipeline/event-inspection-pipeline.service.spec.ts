import { describe, it, expect, vi } from 'vitest';
import { EventInspectionPipelineService } from './event-inspection-pipeline.service';
import { InspectorSingleEventService } from '../../features/inspector/inspector-single-event.service';
import { TestImageRepositoryService } from '../../core/repository/test-event/test-image-repository.service';
import { TestEventDetailRepositoryService } from '../../core/repository/test-event/test-event-detail-repository.service';
import { TestEventRepositoryService } from '../../core/repository/test-event/test-event-repository.service';

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
    return {
      svc: new EventInspectionPipelineService(
        inspector,
        testEventRepository,
        testEventDetailRepository,
        testImageRepository
      ),
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
});
