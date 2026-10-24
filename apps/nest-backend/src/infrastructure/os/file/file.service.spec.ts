import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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

describe('FileService', () => {
  let dir: string;
  let svc: FileService;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'file-svc-'));
    svc = new FileService();
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
});
