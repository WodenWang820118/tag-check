import { HttpException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ProjectReportService } from './project-report.service';

function build() {
  const folderService = { createFolder: vi.fn() };
  const folderPathService = {
    getInspectionEventFolderPath: vi.fn().mockResolvedValue('/rep/evt')
  };
  const service = new ProjectReportService(
    folderService as never,
    folderPathService as never
  );
  return { service, folderService, folderPathService };
}

describe('ProjectReportService', () => {
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
