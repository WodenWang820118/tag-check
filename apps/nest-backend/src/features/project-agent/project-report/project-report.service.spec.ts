import { HttpException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ProjectReportService } from './project-report.service';

function build() {
  const fileService = { getEventReport: vi.fn() };
  const folderService = {
    readFolderFileNames: vi.fn(),
    createFolder: vi.fn()
  };
  const folderPathService = {
    getReportSavingFolderPath: vi.fn().mockResolvedValue('/rep'),
    getInspectionEventFolderPath: vi.fn().mockResolvedValue('/rep/evt')
  };
  const testEventRepositoryService = { listReports: vi.fn() };
  const service = new ProjectReportService(
    fileService as never,
    folderService as never,
    folderPathService as never,
    testEventRepositoryService as never
  );
  return {
    service,
    fileService,
    folderService,
    folderPathService,
    testEventRepositoryService
  };
}

describe('ProjectReportService', () => {
  it('getProjectEventReports() wraps the repository result with the project slug', async () => {
    const ctx = build();
    ctx.testEventRepositoryService.listReports.mockResolvedValue([{ id: 1 }]);
    expect(await ctx.service.getProjectEventReports('demo')).toEqual({
      projectSlug: 'demo',
      reports: [{ id: 1 }]
    });
  });

  it('getProjectEventReportFolderNames() reads names from the resolved report folder', async () => {
    const ctx = build();
    ctx.folderService.readFolderFileNames.mockReturnValue(['a', 'b']);
    expect(await ctx.service.getProjectEventReportFolderNames('demo')).toEqual([
      'a',
      'b'
    ]);
    expect(ctx.folderService.readFolderFileNames).toHaveBeenCalledWith('/rep');
  });

  it('downloadXlsxReport() forwards to fileService.getEventReport', async () => {
    const ctx = build();
    ctx.fileService.getEventReport.mockResolvedValue('xlsx');
    expect(await ctx.service.downloadXlsxReport('demo', 'evt')).toBe('xlsx');
  });

  it('createEventReportFolder() creates the per-event folder via folderService', async () => {
    const ctx = build();
    await ctx.service.createEventReportFolder('demo', 'evt');
    expect(ctx.folderService.createFolder).toHaveBeenCalledWith('/rep/evt');
  });

  it('createEventReportFolder() rethrows downstream errors as 500 HttpException', async () => {
    const ctx = build();
    ctx.folderPathService.getInspectionEventFolderPath.mockRejectedValue(
      new Error('boom')
    );
    await expect(
      ctx.service.createEventReportFolder('demo', 'evt')
    ).rejects.toBeInstanceOf(HttpException);
  });
});
