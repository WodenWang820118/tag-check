import { HttpException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ProjectAbstractReportService } from './project-abstract-report.service';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  statSync: vi.fn(() => ({ mtime: new Date('2025-01-01') }))
}));

import { existsSync, mkdirSync } from 'fs';

function build() {
  const folderPathService = {
    getInspectionEventFolderPath: vi.fn().mockResolvedValue('/evt'),
    getReportSavingFolderPath: vi.fn().mockResolvedValue('/rep')
  };
  const folderService = {
    deleteFolder: vi.fn(),
    readFolderFiles: vi.fn()
  };
  const filePathService = {
    getInspectionResultFilePath: vi.fn().mockResolvedValue('/evt/result.json')
  };
  const fileService = {
    readJsonFile: vi.fn(),
    writeJsonFile: vi.fn()
  };
  const service = new ProjectAbstractReportService(
    folderPathService as never,
    folderService as never,
    filePathService as never,
    fileService as never
  );
  return {
    service,
    folderPathService,
    folderService,
    filePathService,
    fileService
  };
}

describe('ProjectAbstractReportService', () => {
  describe('writeSingleAbstractTestResultJson()', () => {
    it('creates the folder when missing then writes a new file when no existing report', async () => {
      vi.mocked(existsSync).mockImplementation(() => false);
      const ctx = build();
      await ctx.service.writeSingleAbstractTestResultJson('demo', 'evt', {
        passed: true
      } as never);
      expect(mkdirSync).toHaveBeenCalledWith('/evt', { recursive: true });
      expect(ctx.fileService.writeJsonFile).toHaveBeenCalledWith(
        '/evt/result.json',
        { passed: true }
      );
    });

    it('merges new data into the existing report when the file already exists', async () => {
      vi.mocked(existsSync).mockImplementation(() => true);
      const ctx = build();
      ctx.fileService.readJsonFile.mockReturnValue({
        passed: false,
        message: 'old'
      });
      await ctx.service.writeSingleAbstractTestResultJson('demo', 'evt', {
        passed: true
      } as never);
      expect(ctx.fileService.writeJsonFile).toHaveBeenCalledWith(
        '/evt/result.json',
        {
          passed: true,
          message: 'old'
        }
      );
    });

    it('wraps unexpected errors in InternalServerErrorException', async () => {
      vi.mocked(existsSync).mockImplementation(() => false);
      const ctx = build();
      ctx.folderPathService.getInspectionEventFolderPath.mockRejectedValue(
        new Error('boom')
      );
      await expect(
        ctx.service.writeSingleAbstractTestResultJson(
          'demo',
          'evt',
          {} as never
        )
      ).rejects.toThrow('Failed to write report');
    });
  });

  describe('writeProjectAbstractTestRsultJson()', () => {
    it('writes one file per matching event/dataLayerSpec.event pair', async () => {
      const ctx = build();
      ctx.folderService.readFolderFiles.mockReturnValue([
        { name: 'page_view', isDirectory: () => true },
        { name: 'add_to_cart', isDirectory: () => true },
        { name: 'ignore-file.txt', isDirectory: () => false }
      ]);
      await ctx.service.writeProjectAbstractTestRsultJson('demo', [
        { dataLayerSpec: { event: 'page_view' } } as never,
        { dataLayerSpec: { event: 'unmatched' } } as never
      ]);
      expect(ctx.fileService.writeJsonFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteSingleAbstractTestResultFolder()', () => {
    it('throws NotFound when the folder does not exist', async () => {
      vi.mocked(existsSync).mockImplementation(() => false);
      const ctx = build();
      await expect(
        ctx.service.deleteSingleAbstractTestResultFolder('demo', 'evt')
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deletes the folder when it exists', async () => {
      vi.mocked(existsSync).mockImplementation(() => true);
      const ctx = build();
      await ctx.service.deleteSingleAbstractTestResultFolder('demo', 'evt');
      expect(ctx.folderService.deleteFolder).toHaveBeenCalledWith('/evt');
    });

    it('wraps non-NotFound errors in HttpException', async () => {
      vi.mocked(existsSync).mockImplementation(() => true);
      const ctx = build();
      ctx.folderService.deleteFolder.mockImplementation(() => {
        throw new Error('rm failed');
      });
      await expect(
        ctx.service.deleteSingleAbstractTestResultFolder('demo', 'evt')
      ).rejects.toBeInstanceOf(HttpException);
    });
  });

  describe('getSingleAbstractTestResultJson()', () => {
    it('throws NotFound when the file is missing', async () => {
      vi.mocked(existsSync).mockImplementation(() => false);
      const ctx = build();
      await expect(
        ctx.service.getSingleAbstractTestResultJson('demo', 'evt')
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the report contents augmented with the completedTime mtime', async () => {
      vi.mocked(existsSync).mockImplementation(() => true);
      const ctx = build();
      ctx.fileService.readJsonFile.mockReturnValue({
        passed: true,
        message: 'ok'
      });
      const result = await ctx.service.getSingleAbstractTestResultJson(
        'demo',
        'evt'
      );
      expect(result).toMatchObject({ passed: true, message: 'ok' });
      expect(result.completedTime).toBeInstanceOf(Date);
    });
  });
});
