import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  writeFileSync,
  rmSync,
  existsSync,
  readFileSync,
  mkdtempSync
} from 'fs';
import { NotFoundException } from '@nestjs/common';
import { FileService } from './file.service';
import { FolderService } from '../folder/folder.service';
import { FolderPathService } from '../path/folder-path/folder-path.service';
import { FilePathService } from '../path/file-path/file-path.service';

describe('FileService', () => {
  let dir: string;
  let svc: FileService;
  let folderService: FolderService;
  let folderPathService: FolderPathService;
  let filePathService: FilePathService;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'file-svc-'));
    folderService = {
      getJsonFilesFromDir: vi.fn(() => ['a.json', 'readme.txt']),
      readFolderFileNames: vi.fn(() => ['evt-123.xlsx', 'noise.bin'])
    } as unknown as FolderService;
    folderPathService = {
      getRecordingFolderPath: vi.fn(async () => dir),
      getInspectionEventFolderPath: vi.fn(async () => dir)
    } as unknown as FolderPathService;
    filePathService = {
      getReportFilePath: vi.fn(async (_p, _e, name) => join(dir, name)),
      getCacheFilePath: vi.fn(async (_p, e) => join(dir, `${e}-cache.json`))
    } as unknown as FilePathService;
    svc = new FileService(folderService, folderPathService, filePathService);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('readJsonFile returns parsed contents', () => {
    const fp = join(dir, 'x.json');
    writeFileSync(fp, JSON.stringify({ a: 1 }));
    expect(svc.readJsonFile<{ a: number }>(fp)).toEqual({ a: 1 });
  });

  it('readJsonFile throws NotFoundException when missing', () => {
    expect(() => svc.readJsonFile(join(dir, 'missing.json'))).toThrow(
      NotFoundException
    );
  });

  it('writeJsonFile creates the directory and writes a JSON document', () => {
    const fp = join(dir, 'sub', 'inner', 'file.json');
    svc.writeJsonFile(fp, { v: 7 });
    expect(existsSync(fp)).toBe(true);
    expect(JSON.parse(readFileSync(fp, 'utf8'))).toEqual({ v: 7 });
  });

  it('deleteFile removes a file', () => {
    const fp = join(dir, 'gone.txt');
    writeFileSync(fp, 'x');
    svc.deleteFile(fp);
    expect(existsSync(fp)).toBe(false);
  });

  it('writeCacheFile resolves the cache path and writes the data', async () => {
    await svc.writeCacheFile('p', 'e', { ok: true });
    expect(filePathService.getCacheFilePath).toHaveBeenCalledWith('p', 'e');
    expect(existsSync(join(dir, 'e-cache.json'))).toBe(true);
  });

  it('getOperationJsonByProject filters json files', async () => {
    const out = await svc.getOperationJsonByProject('p');
    expect(out).toEqual(['a.json']);
  });

  it('getEventReport throws when no matching xlsx exists', async () => {
    folderService.readFolderFileNames = vi.fn(() => ['nope.txt']) as never;
    await expect(svc.getEventReport('p', 'evt-123')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('getEventReport returns a StreamableFile when a matching xlsx exists', async () => {
    const target = join(dir, 'evt-123.xlsx');
    writeFileSync(target, 'data');
    const out = await svc.getEventReport('p', 'evt-123');
    expect(out).toBeDefined();
    // drain & close to avoid the open() racing with afterEach cleanup
    await new Promise<void>((resolve) => {
      const s = out.getStream();
      s.on('close', () => resolve());
      s.on('error', () => resolve());
      s.resume();
    });
  });

  it('readReport throws NotFoundException when the report is missing', async () => {
    await expect(
      svc.readReport('p', 'e', 'missing.xlsx')
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
