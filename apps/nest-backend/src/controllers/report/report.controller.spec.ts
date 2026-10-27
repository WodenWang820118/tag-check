import { afterEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ReportController } from './report.controller';

/** The report endpoints set only the `x-request-id` header on the reply. */
function replyMock() {
  const header = vi.fn();
  const reply: Pick<FastifyReply, 'header'> = { header };
  return { header, response: reply as FastifyReply };
}

describe('ReportController', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function build() {
    const projectReportService = {
      createEventReportFolder: vi.fn().mockResolvedValue(undefined)
    };
    const projectAbstractReportService = {
      writeSingleAbstractTestResultJson: vi.fn().mockResolvedValue(undefined),
      deleteSingleAbstractTestResultFolder: vi.fn().mockResolvedValue('deleted')
    };
    const testReportFacadeRepositoryService = {
      createFullReport: vi.fn().mockResolvedValue('full-report'),
      getReportDetail: vi.fn().mockResolvedValue({ eventId: 'evt-1' }),
      deleteTests: vi.fn().mockResolvedValue('deleted-batch')
    };
    const testEventRepositoryService = {
      listReports: vi.fn().mockResolvedValue([{ eventId: 'evt-1' }]),
      deleteByProjectSlugAndEventIds: vi
        .fn()
        .mockResolvedValue('deleted-batch'),
      updateTestEvents: vi.fn().mockResolvedValue('updated')
    };
    const projectRecordingService = {
      addRecording: vi.fn().mockResolvedValue(undefined)
    };
    const controller = new ReportController(
      projectReportService as never,
      projectAbstractReportService as never,
      testReportFacadeRepositoryService as never,
      testEventRepositoryService as never,
      projectRecordingService as never
    );
    return {
      controller,
      projectRecordingService,
      projectReportService,
      projectAbstractReportService,
      testReportFacadeRepositoryService,
      testEventRepositoryService
    };
  }

  it('getProjectEventReports delegates to TestEventRepositoryService.listReports', async () => {
    const { controller, testEventRepositoryService } = build();
    const logSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    const request = {
      id: 'req-1',
      headers: { 'x-request-id': '11111111-1111-4111-8111-111111111111' }
    } as never;
    const { header, response } = replyMock();
    const result = await controller.getProjectEventReports(
      'proj-1',
      request,
      response
    );
    expect(testEventRepositoryService.listReports).toHaveBeenCalledWith(
      'proj-1'
    );
    expect(result).toEqual([{ eventId: 'evt-1' }]);
    expect(request).toMatchObject({
      diagnosticContext: {
        operation: 'reports.list',
        projectSlug: 'proj-1'
      }
    });
    expect(logSpy).toHaveBeenCalledWith(
      JSON.stringify({
        operation: 'reports.list',
        projectSlug: 'proj-1',
        requestId: '11111111-1111-4111-8111-111111111111',
        count: 1
      })
    );
    expect(header).toHaveBeenCalledWith(
      'x-request-id',
      '11111111-1111-4111-8111-111111111111'
    );
  });

  it('getProjectEventReports ignores malformed client request ids in logs and response headers', async () => {
    const { controller } = build();
    const logSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    const request = {
      id: 'req-safe',
      headers: { 'x-request-id': 'oversized-or-malformed-request-id' }
    } as never;
    const { header, response } = replyMock();

    await controller.getProjectEventReports('proj-1', request, response);

    expect(logSpy).toHaveBeenCalledWith(
      JSON.stringify({
        operation: 'reports.list',
        projectSlug: 'proj-1',
        requestId: 'req-safe',
        count: 1
      })
    );
    expect(header).toHaveBeenCalledWith('x-request-id', 'req-safe');
  });

  it('getProjectEventReports preserves repository failures after attaching diagnostic context', async () => {
    const { controller, testEventRepositoryService } = build();
    const error = new Error('db down');
    testEventRepositoryService.listReports.mockRejectedValueOnce(error);
    const request = { id: 'req-2', headers: {} } as never;

    await expect(
      controller.getProjectEventReports('proj-2', request)
    ).rejects.toBe(error);
    expect(request).toMatchObject({
      diagnosticContext: {
        operation: 'reports.list',
        projectSlug: 'proj-2'
      }
    });
  });

  it('deleteProjectEventReports deletes the tests with their files through the facade', async () => {
    const { controller, testReportFacadeRepositoryService } = build();
    const result = await controller.deleteProjectEventReports('proj-1', [
      'a',
      'b'
    ]);
    expect(testReportFacadeRepositoryService.deleteTests).toHaveBeenCalledWith(
      'proj-1',
      ['a', 'b']
    );
    expect(result).toBe('deleted-batch');
  });

  it('updateReport writes the abstract test result JSON via the abstract report service', async () => {
    const { controller, projectAbstractReportService } = build();
    const report = { eventId: 'evt-1', testName: 't' } as never;
    await controller.updateReport('proj-1', 'evt-1', report);
    expect(
      projectAbstractReportService.writeSingleAbstractTestResultJson
    ).toHaveBeenCalledWith('proj-1', 'evt-1', report);
  });

  it('addReport creates the report folder, the full report record and the recording file', async () => {
    const {
      controller,
      projectReportService,
      testReportFacadeRepositoryService,
      projectRecordingService
    } = build();
    const steps = [{ type: 'navigate', url: 'https://shop.example' }];
    const reportData = {
      reportDetails: { eventName: 'add_to_cart' },
      recording: { title: 'ignored', steps }
    } as never;
    const result = await controller.addReport('proj-1', 'evt-1', reportData);
    expect(projectRecordingService.addRecording).toHaveBeenCalledWith(
      'proj-1',
      'evt-1',
      { title: 'add_to_cart', steps }
    );
    expect(projectReportService.createEventReportFolder).toHaveBeenCalledWith(
      'proj-1',
      'evt-1'
    );
    expect(
      testReportFacadeRepositoryService.createFullReport
    ).toHaveBeenCalledWith('proj-1', 'evt-1', reportData);
    expect(result).toBe('full-report');
  });

  it('deleteReport delegates to projectAbstractReportService.deleteSingleAbstractTestResultFolder', async () => {
    const { controller, projectAbstractReportService } = build();
    const result = await controller.deleteReport('proj-1', 'evt-1');
    expect(
      projectAbstractReportService.deleteSingleAbstractTestResultFolder
    ).toHaveBeenCalledWith('proj-1', 'evt-1');
    expect(result).toBe('deleted');
  });

  it('getReportDetails delegates to TestReportFacadeRepositoryService.getReportDetail', async () => {
    const { controller, testReportFacadeRepositoryService } = build();
    const result = await controller.getReportDetails('proj-1', 'evt-1');
    expect(
      testReportFacadeRepositoryService.getReportDetail
    ).toHaveBeenCalledWith('proj-1', 'evt-1', undefined);
    expect(result).toEqual({ eventId: 'evt-1' });

    await controller.getReportDetails('proj-1', 'evt-1', 7);
    expect(
      testReportFacadeRepositoryService.getReportDetail
    ).toHaveBeenLastCalledWith('proj-1', 'evt-1', 7);
  });

  it('updateTestEvents maps each report into an UpdateTestEventDto and forwards them', async () => {
    const { controller, testEventRepositoryService } = build();
    const reports = [
      {
        eventId: 'evt-1',
        testName: 'test',
        eventName: 'view_item',
        message: 'ok',
        stopNavigation: false
      }
    ] as never;
    await controller.updateTestEvents('proj-1', reports);

    expect(testEventRepositoryService.updateTestEvents).toHaveBeenCalledOnce();
    const [slug, events] =
      testEventRepositoryService.updateTestEvents.mock.calls[0];
    expect(slug).toBe('proj-1');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      eventId: 'evt-1',
      testName: 'test',
      eventName: 'view_item',
      message: 'ok',
      stopNavigation: false
    });
  });
});
