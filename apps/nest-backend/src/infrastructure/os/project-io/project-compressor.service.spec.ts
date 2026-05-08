import { describe, it, expect } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  statSync,
  existsSync
} from 'fs';
import { ProjectCompressor } from './project-compressor.service';

describe('ProjectCompressor', () => {
  it('creates a non-empty zip containing project files plus extra files', async () => {
    const root = mkdtempSync(join(tmpdir(), 'compressor-'));
    try {
      const projectFolder = join(root, 'proj');
      mkdirSync(projectFolder, { recursive: true });
      writeFileSync(join(projectFolder, 'a.txt'), 'hello');
      const extra = join(root, 'extra.json');
      writeFileSync(extra, JSON.stringify({ a: 1 }));
      const out = join(root, 'out.zip');

      const svc = new ProjectCompressor();
      await svc.compress(projectFolder, out, 'p', [
        { path: extra, name: 'fixture.json' }
      ]);

      expect(existsSync(out)).toBe(true);
      expect(statSync(out).size).toBeGreaterThan(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('logs a warning and continues when an extra file does not exist', async () => {
    const root = mkdtempSync(join(tmpdir(), 'compressor-'));
    try {
      const projectFolder = join(root, 'proj');
      mkdirSync(projectFolder, { recursive: true });
      writeFileSync(join(projectFolder, 'a.txt'), 'hi');
      const out = join(root, 'out.zip');
      const svc = new ProjectCompressor();
      await svc.compress(projectFolder, out, 'p', [
        { path: join(root, 'missing.json') }
      ]);
      expect(existsSync(out)).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
