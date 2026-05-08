import { describe, expect, it, vi } from 'vitest';
import { ProjectInitializationService } from './project-initialization.service';

vi.mock('fs', () => ({
  existsSync: vi.fn(() => false),
  mkdirSync: vi.fn()
}));

import { existsSync, mkdirSync } from 'fs';

function build() {
  const folderService = { createFolder: vi.fn() };
  const folderPathService = {
    getRootProjectFolderPath: vi.fn().mockResolvedValue('/root'),
    getProjectFolderPath: vi.fn().mockResolvedValue('/root/demo'),
    getRecordingFolderPath: vi.fn().mockResolvedValue('/root/demo/rec'),
    getReportSavingFolderPath: vi.fn().mockResolvedValue('/root/demo/rep'),
    getProjectConfigFolderPath: vi.fn().mockResolvedValue('/root/demo/cfg'),
    getInspectionEventFolderPath: vi.fn().mockResolvedValue('/root/demo/evt')
  };
  const projectFacadeService = {
    createProject: vi.fn().mockResolvedValue({ id: 1 })
  };
  const service = new ProjectInitializationService(
    folderService as never,
    folderPathService as never,
    projectFacadeService as never
  );
  return { service, folderService, folderPathService, projectFacadeService };
}

describe('ProjectInitializationService', () => {
  it('initProjectFileSystem() creates root if missing then four project subfolders, then delegates to facade', async () => {
    vi.mocked(existsSync).mockReturnValue(false);
    const ctx = build();
    const result = await ctx.service.initProjectFileSystem('demo', {
      projectSlug: 'demo'
    } as never);
    expect(mkdirSync).toHaveBeenCalledWith('/root', { recursive: true });
    expect(ctx.folderService.createFolder).toHaveBeenCalledTimes(4);
    expect(ctx.projectFacadeService.createProject).toHaveBeenCalledWith({
      projectSlug: 'demo'
    });
    expect(result).toEqual({ id: 1 });
  });

  it('initProjectFileSystem() short-circuits folder creation when the project folder already exists', async () => {
    vi.mocked(existsSync).mockImplementation((p: never) => p === '/root/demo');
    const ctx = build();
    await ctx.service.initProjectFileSystem('demo', {
      projectSlug: 'demo'
    } as never);
    // root exists -> no mkdir; project folder exists -> no createFolder for sub-paths
    expect(ctx.folderService.createFolder).not.toHaveBeenCalled();
  });

  it('initInspectionEventSavingFolder() creates the per-event folder', async () => {
    const ctx = build();
    await ctx.service.initInspectionEventSavingFolder('demo', 'evt');
    expect(ctx.folderService.createFolder).toHaveBeenCalledWith(
      '/root/demo/evt'
    );
  });
});
