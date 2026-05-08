import { describe, expect, it, vi } from 'vitest';
import { ProjectFileReportService } from './project-file-report.service';

function build() {
  const folderService = { readFolder: vi.fn() };
  const folderPathService = {
    getReportSavingFolderPath: vi.fn().mockResolvedValue('/rep')
  };
  const xlsxReportService = { writeXlsxFile: vi.fn() };
  const testEventRepositoryService = {
    listReports: vi.fn(),
    deleteByProjectSlugAndEventId: vi.fn(),
    deleteByProjectSlugAndEventIds: vi.fn(),
    getBySlugAndEventIds: vi.fn()
  };
  const service = new ProjectFileReportService(
    folderService as never,
    folderPathService as never,
    xlsxReportService as never,
    testEventRepositoryService as never
  );
  return {
    service,
    folderService,
    xlsxReportService,
    testEventRepositoryService
  };
}

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

  it('getReportFolderFiles() delegates to listReports', async () => {
    const ctx = build();
    ctx.testEventRepositoryService.listReports.mockResolvedValue([{ id: 1 }]);
    expect(await ctx.service.getReportFolderFiles('demo')).toEqual([{ id: 1 }]);
  });

  it('deleteReportFile() forwards to repository delete-by-slug-and-event', async () => {
    const ctx = build();
    await ctx.service.deleteReportFile('demo', 'evt');
    expect(
      ctx.testEventRepositoryService.deleteByProjectSlugAndEventId
    ).toHaveBeenCalledWith('demo', 'evt');
  });

  it('deleteSelectedFiles() forwards multiple event ids', async () => {
    const ctx = build();
    await ctx.service.deleteSelectedFiles('demo', ['a', 'b']);
    expect(
      ctx.testEventRepositoryService.deleteByProjectSlugAndEventIds
    ).toHaveBeenCalledWith('demo', ['a', 'b']);
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
