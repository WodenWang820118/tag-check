import { describe, expect, it, vi } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { REPORT_DETAIL_SAMPLE } from '@utils';
import { FullTestEventResponseDto } from '../../../shared';
import { ProjectFileReportService } from './project-file-report.service';

function build() {
  const runRecordingsService = {
    removeRuns: vi.fn().mockResolvedValue(undefined),
    removeLegacy: vi.fn().mockResolvedValue(undefined)
  };
  const xlsxReportService = { writeXlsxFile: vi.fn() };
  const testEventRepositoryService = {
    getBySlugAndEventIds: vi.fn()
  };
  const testEventDetailRepositoryService = {
    deleteRuns: vi.fn(),
    getRunScreenshot: vi.fn().mockResolvedValue(null)
  };
  const service = new ProjectFileReportService(
    runRecordingsService as never,
    xlsxReportService as never,
    testEventRepositoryService as never,
    testEventDetailRepositoryService as never
  );
  return {
    service,
    runRecordingsService,
    xlsxReportService,
    testEventRepositoryService,
    testEventDetailRepositoryService
  };
}

describe('ProjectFileReportService', () => {
  function reportWithRuns() {
    return plainToInstance(FullTestEventResponseDto, {
      ...REPORT_DETAIL_SAMPLE.testEvent,
      testEventDetails: [
        REPORT_DETAIL_SAMPLE.testEventDetails,
        {
          ...REPORT_DETAIL_SAMPLE.testEventDetails,
          id: 5,
          passed: false,
          message: 'Old failure'
        }
      ],
      latestTestEventDetail: REPORT_DETAIL_SAMPLE.testEventDetails,
      latestTestImage: REPORT_DETAIL_SAMPLE.testImage
    });
  }

  it('exports one run and its own summary and screenshot when a run filter is given', async () => {
    const ctx = build();
    ctx.testEventRepositoryService.getBySlugAndEventIds.mockResolvedValue([
      reportWithRuns()
    ]);
    ctx.testEventDetailRepositoryService.getRunScreenshot.mockResolvedValue({
      id: 5,
      imageName: 'old.png'
    });

    await ctx.service.downloadReportFiles(
      'demo',
      [REPORT_DETAIL_SAMPLE.testEvent.eventId],
      5
    );

    expect(ctx.xlsxReportService.writeXlsxFile).toHaveBeenCalledWith([
      expect.objectContaining({
        testEventDetails: [expect.objectContaining({ id: 5 })],
        latestTestEventDetail: expect.objectContaining({
          id: 5,
          passed: false
        }),
        latestTestImage: expect.objectContaining({
          id: 5,
          imageName: 'old.png'
        }),
        message: 'Old failure'
      })
    ]);
    expect(
      ctx.testEventDetailRepositoryService.getRunScreenshot
    ).toHaveBeenCalledWith(
      'demo',
      REPORT_DETAIL_SAMPLE.testEvent.eventId,
      5,
      true
    );
  });

  it('does not export the latest run for a missing or foreign run filter', async () => {
    const ctx = build();
    ctx.testEventRepositoryService.getBySlugAndEventIds.mockResolvedValue([
      reportWithRuns()
    ]);
    await expect(
      ctx.service.downloadReportFiles(
        'demo',
        [REPORT_DETAIL_SAMPLE.testEvent.eventId],
        999
      )
    ).rejects.toMatchObject({ status: 404 });
    expect(ctx.xlsxReportService.writeXlsxFile).not.toHaveBeenCalled();
  });

  it("deleteRuns() deletes the runs and their recordings, and a deleted latest run's old ones", async () => {
    const ctx = build();
    const deletedRecordings = [{ eventId: 'add_to_cart', recordingKey: 'k' }];
    ctx.testEventDetailRepositoryService.deleteRuns.mockResolvedValue({
      deletedRunIds: [7, 3],
      latestRunDeletedEventIds: ['add_to_cart', 'purchase'],
      deletedRecordings
    });

    const result = await ctx.service.deleteRuns('demo', [7, 3]);

    expect(
      ctx.testEventDetailRepositoryService.deleteRuns
    ).toHaveBeenCalledWith('demo', [7, 3]);
    expect(result).toEqual({ deletedRunIds: [7, 3] });
    expect(ctx.runRecordingsService.removeRuns).toHaveBeenCalledWith(
      'demo',
      deletedRecordings
    );
    expect(ctx.runRecordingsService.removeLegacy).toHaveBeenCalledWith(
      'demo',
      'add_to_cart'
    );
    expect(ctx.runRecordingsService.removeLegacy).toHaveBeenCalledWith(
      'demo',
      'purchase'
    );
  });

  it('downloadReportFiles() throws when no reports are returned', async () => {
    const ctx = build();
    ctx.testEventRepositoryService.getBySlugAndEventIds.mockResolvedValue([]);
    await expect(
      ctx.service.downloadReportFiles('demo', ['a'])
    ).rejects.toThrow('No reports found');
  });

  it('downloadReportFiles() writes the xlsx report when reports are present', async () => {
    const ctx = build();
    const reports = [reportWithRuns()];
    ctx.testEventRepositoryService.getBySlugAndEventIds.mockResolvedValue(
      reports
    );
    ctx.xlsxReportService.writeXlsxFile.mockResolvedValue('xlsx-buffer');
    expect(await ctx.service.downloadReportFiles('demo', ['a'])).toBe(
      'xlsx-buffer'
    );
    expect(ctx.xlsxReportService.writeXlsxFile).toHaveBeenCalledWith(reports);
    expect(
      ctx.testEventDetailRepositoryService.getRunScreenshot
    ).not.toHaveBeenCalled();
  });
});
