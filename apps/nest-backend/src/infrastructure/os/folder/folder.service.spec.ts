import { NotFoundException } from '@nestjs/common';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FolderService } from './folder.service';

describe('FolderService', () => {
  const service = new FolderService();
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'tagcheck-folder-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('readFolderFiles lists dirents within an existing folder', () => {
    writeFileSync(join(dir, 'a.txt'), '');
    mkdirSync(join(dir, 'sub'));
    const dirents = service.readFolderFiles(dir);
    const names = dirents.map((d) => d.name).sort();
    expect(names).toEqual(['a.txt', 'sub']);
  });

  it('readFolderFiles throws NotFoundException for missing folders', () => {
    expect(() => service.readFolderFiles(join(dir, 'missing'))).toThrow(
      NotFoundException
    );
  });

  it('readFolder returns only directory entries', () => {
    writeFileSync(join(dir, 'a.txt'), '');
    mkdirSync(join(dir, 'sub'));
    const dirs = service.readFolder(dir);
    expect(dirs.map((d) => d.name)).toEqual(['sub']);
  });

  it('createFolder is idempotent and creates parents when needed', () => {
    const nested = join(dir, 'a', 'b', 'c');
    service.createFolder(nested);
    service.createFolder(nested);
    expect(service.readFolderFileNames(join(dir, 'a', 'b'))).toEqual(['c']);
  });

  it('getJsonFilesFromDir returns only .json files', () => {
    writeFileSync(join(dir, 'a.json'), '{}');
    writeFileSync(join(dir, 'b.txt'), '');
    expect(service.getJsonFilesFromDir(dir)).toEqual(['a.json']);
  });

  it('getJsonFilesFromDir throws when the folder is empty', () => {
    expect(() => service.getJsonFilesFromDir(dir)).toThrow(NotFoundException);
  });

  it('deleteFolder removes the folder and throws on subsequent calls', () => {
    const target = join(dir, 'gone');
    mkdirSync(target);
    service.deleteFolder(target);
    expect(() => service.deleteFolder(target)).toThrow(NotFoundException);
  });
});
