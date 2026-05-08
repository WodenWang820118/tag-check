import { HttpException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ProjectService } from './project.service';

function build() {
  const fileService = { readJsonFile: vi.fn() };
  const folderService = { readFolderFiles: vi.fn() };
  const folderPathService = {
    getRootProjectFolderPath: vi.fn().mockResolvedValue('/root')
  };
  const filePathService = {
    getProjectSettingFilePath: vi
      .fn()
      .mockResolvedValue('/root/demo/settings.json'),
    getProjectMetaDataFilePath: vi
      .fn()
      .mockResolvedValue('/root/demo/meta.json')
  };
  const service = new ProjectService(
    fileService as never,
    folderService as never,
    folderPathService as never,
    filePathService as never
  );
  return { service, fileService, folderService };
}

describe('ProjectService', () => {
  it('getProjectSettings() reads the settings file from the resolved path', async () => {
    const ctx = build();
    ctx.fileService.readJsonFile.mockReturnValue({ headless: true });
    expect(await ctx.service.getProjectSettings('demo')).toEqual({
      headless: true
    });
  });

  it('getProjectsMetadata() returns metadata for every project directory under the root', async () => {
    const ctx = build();
    ctx.folderService.readFolderFiles.mockReturnValue([
      { name: 'demo', isDirectory: () => true },
      { name: 'other', isDirectory: () => true },
      { name: 'ignore.txt', isDirectory: () => false }
    ]);
    ctx.fileService.readJsonFile
      .mockReturnValueOnce({ projectSlug: 'demo' })
      .mockReturnValueOnce({ projectSlug: 'other' });
    const result = await ctx.service.getProjectsMetadata();
    expect(result).toEqual([{ projectSlug: 'demo' }, { projectSlug: 'other' }]);
  });

  it('getProjectMetadata() throws 404 HttpException when the project folder is missing', async () => {
    const ctx = build();
    ctx.folderService.readFolderFiles.mockReturnValue([]);
    await expect(ctx.service.getProjectMetadata('demo')).rejects.toBeInstanceOf(
      HttpException
    );
  });

  it('getProjectMetadata() reads the meta file when the project folder exists', async () => {
    const ctx = build();
    ctx.folderService.readFolderFiles.mockReturnValue([
      { name: 'demo', isDirectory: () => true }
    ]);
    ctx.fileService.readJsonFile.mockReturnValue({ projectSlug: 'demo' });
    expect(await ctx.service.getProjectMetadata('demo')).toEqual({
      projectSlug: 'demo'
    });
  });
});
