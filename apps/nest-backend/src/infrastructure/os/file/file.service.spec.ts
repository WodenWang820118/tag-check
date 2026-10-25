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
import { FilePathService } from '../path/file-path/file-path.service';

describe('FileService', () => {
  let dir: string;
  let svc: FileService;
  let filePathService: FilePathService;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'file-svc-'));
    filePathService = {
      getCacheFilePath: vi.fn(async (_p, e) => join(dir, `${e}-cache.json`))
    } as unknown as FilePathService;
    svc = new FileService(filePathService);
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

  it('writeCacheFile resolves the cache path and writes the data', async () => {
    await svc.writeCacheFile('p', 'e', { ok: true });
    expect(filePathService.getCacheFilePath).toHaveBeenCalledWith('p', 'e');
    expect(existsSync(join(dir, 'e-cache.json'))).toBe(true);
  });
});
