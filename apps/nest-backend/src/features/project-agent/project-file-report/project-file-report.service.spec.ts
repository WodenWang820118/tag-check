import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProjectFileReportService } from './project-file-report.service';

let root = '';

function build() {
  root = mkdtempSync(join(tmpdir(), 'file-report-'));
  const runRecordingsService = {
    removeRuns: vi.fn().mockResolvedValue(undefined),
    removeLegacy: vi.fn().mockResolvedValue(undefined)
  };
  const xlsxReportService = { writeXlsxFile: vi.fn() };
  const testEventRepositoryService = {
    getBySlugAndEventIds: vi.fn()
  };
  const testEventDetailRepositoryService = {
    deleteRuns: vi.fn()
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

afterEach(() => {
  if (root) rmSync(root, { recursive: true, force: true });
});

describe('ProjectFileReportService', () => {
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
    ctx.testEventRepositoryService.getBySlugAndEventIds.mockResolvedValue([
      { id: 1 }
    ]);
    ctx.xlsxReportService.writeXlsxFile.mockResolvedValue('xlsx-buffer');
    expect(await ctx.service.downloadReportFiles('demo', ['a'])).toBe(
      'xlsx-buffer'
    );
    expect(ctx.xlsxReportService.writeXlsxFile).toHaveBeenCalledWith([
      { id: 1 }
    ]);
  });
});
