import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProjectFileReportService } from './project-file-report.service';

let root = '';

function build() {
  root = mkdtempSync(join(tmpdir(), 'file-report-'));
  const folderService = { readFolder: vi.fn() };
  const folderPathService = {
    getReportSavingFolderPath: vi.fn().mockResolvedValue('/rep'),
    getInspectionEventFolderPath: vi.fn(
      async (_projectSlug: string, eventId: string) => join(root, eventId)
    )
  };
  const xlsxReportService = { writeXlsxFile: vi.fn() };
  const testEventRepositoryService = {
    getBySlugAndEventIds: vi.fn()
  };
  const testEventDetailRepositoryService = {
    deleteRuns: vi.fn()
  };
  const service = new ProjectFileReportService(
    folderService as never,
    folderPathService as never,
    xlsxReportService as never,
    testEventRepositoryService as never,
    testEventDetailRepositoryService as never
  );
  return {
    service,
    folderService,
    xlsxReportService,
    testEventRepositoryService,
    testEventDetailRepositoryService
  };
}

afterEach(() => {
  if (root) rmSync(root, { recursive: true, force: true });
});

describe('ProjectFileReportService', () => {
  it('getReportFolders() maps each dirent to {name, path}', async () => {
    const ctx = build();
    ctx.folderService.readFolder.mockReturnValue([
      { name: 'a', parentPath: '/rep' },
      { name: 'b', parentPath: '/rep' }
    ]);
    const result = await ctx.service.getReportFolders('demo');
    expect(result).toEqual([
      { name: 'a', path: expect.stringContaining('a') },
      { name: 'b', path: expect.stringContaining('b') }
    ]);
  });

  it('deleteRuns() deletes the runs and the recording of a test whose latest run went', async () => {
    const ctx = build();
    for (const eventId of ['latest-deleted', 'older-deleted']) {
      mkdirSync(join(root, eventId));
      writeFileSync(join(root, eventId, 'recording.webm'), 'webm');
      writeFileSync(
        join(root, eventId, 'recording-tag-assistant.webm'),
        'webm'
      );
    }
    ctx.testEventDetailRepositoryService.deleteRuns.mockResolvedValue({
      deletedRunIds: [7, 3],
      latestRunDeletedEventIds: ['latest-deleted', 'no-recording']
    });

    const result = await ctx.service.deleteRuns('demo', [7, 3]);

    expect(
      ctx.testEventDetailRepositoryService.deleteRuns
    ).toHaveBeenCalledWith('demo', [7, 3]);
    expect(result).toEqual({ deletedRunIds: [7, 3] });
    expect(existsSync(join(root, 'latest-deleted', 'recording.webm'))).toBe(
      false
    );
    expect(
      existsSync(join(root, 'latest-deleted', 'recording-tag-assistant.webm'))
    ).toBe(false);
    expect(
      existsSync(join(root, 'older-deleted', 'recording-tag-assistant.webm'))
    ).toBe(true);
    expect(existsSync(join(root, 'older-deleted', 'recording.webm'))).toBe(
      true
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
