import { NotFoundException } from '@nestjs/common';
import { mkdtempSync, mkdirSync, rmSync } from 'fs';
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

  it('deleteFolder removes the folder and throws on subsequent calls', () => {
    const target = join(dir, 'gone');
    mkdirSync(target);
    service.deleteFolder(target);
    expect(() => service.deleteFolder(target)).toThrow(NotFoundException);
  });
});
