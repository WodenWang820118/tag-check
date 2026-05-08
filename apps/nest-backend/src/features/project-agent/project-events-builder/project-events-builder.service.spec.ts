import { describe, expect, it, vi } from 'vitest';
import { ProjectEventsBuilderService } from './project-events-builder.service';

function build() {
  const projectReportService = { createEventReportFolder: vi.fn() };
  const testReportFacadeRepositoryService = { createFullReport: vi.fn() };
  const projectRecordingService = { addRecording: vi.fn() };
  const dataLayerSpecBuilderService = {
    buildDataLayerSpec: vi.fn().mockReturnValue({ event: 'page_view' })
  };
  const service = new ProjectEventsBuilderService(
    projectReportService as never,
    testReportFacadeRepositoryService as never,
    projectRecordingService as never,
    dataLayerSpecBuilderService as never
  );
  return {
    service,
    projectReportService,
    testReportFacadeRepositoryService,
    projectRecordingService,
    dataLayerSpecBuilderService
  };
}

describe('ProjectEventsBuilderService', () => {
  it('buildEvents() short-circuits with no inputs', async () => {
    const ctx = build();
    await ctx.service.buildEvents('demo', []);
    expect(
      ctx.projectReportService.createEventReportFolder
    ).not.toHaveBeenCalled();
  });

  it('buildEvents() creates report folder, adds recording, and creates full report for each input', async () => {
    const ctx = build();
    await ctx.service.buildEvents('demo', [
      {
        eventName: 'page_view',
        testName: 'tag-a',
        recording: { title: 'page_view', steps: [] },
        spec: { tag: {}, trigger: [] } as never
      },
      {
        eventName: 'add_to_cart',
        testName: 'tag-b',
        recording: { title: 'add_to_cart', steps: [] },
        spec: { tag: {}, trigger: [] } as never
      }
    ]);
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

  it('buildEvents() rethrows when downstream createFullReport fails', async () => {
    const ctx = build();
    ctx.testReportFacadeRepositoryService.createFullReport.mockRejectedValue(
      new Error('boom')
    );
    await expect(
      ctx.service.buildEvents('demo', [
        {
          eventName: 'page_view',
          testName: 'tag-a',
          recording: { title: 'page_view', steps: [] },
          spec: { tag: {}, trigger: [] } as never
        }
      ])
    ).rejects.toThrow('boom');
  });
});
