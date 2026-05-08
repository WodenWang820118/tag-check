import { describe, it, expect } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { ProjectCompressor } from './project-compressor.service';
import { ProjectUnzipper } from './project-unzipper.service';

describe('ProjectUnzipper', () => {
  it('round-trips a project: compress then unzip and infer slug from the fixture file name', async () => {
    const root = mkdtempSync(join(tmpdir(), 'unzipper-'));
    try {
      const projectFolder = join(root, 'src-proj');
      mkdirSync(projectFolder, { recursive: true });
      writeFileSync(join(projectFolder, 'inner.txt'), 'data');
      const fixture = join(root, 'real-slug.fixture.json');
      writeFileSync(fixture, '{}');
      const zip = join(root, 'archive.zip');
      const dest = join(root, 'extracted');
      mkdirSync(dest, { recursive: true });

      await new ProjectCompressor().compress(projectFolder, zip, 'real-slug', [
        { path: fixture }
      ]);
      const slug = await new ProjectUnzipper().unzip('fallback', zip, dest);
      expect(slug).toBe('real-slug');
      expect(existsSync(join(dest, 'real-slug', 'inner.txt'))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('falls back to the provided slug when no fixture is present and avoids overwriting', async () => {
    const root = mkdtempSync(join(tmpdir(), 'unzipper-'));
    try {
      const projectFolder = join(root, 'src-proj');
      mkdirSync(projectFolder, { recursive: true });
      writeFileSync(join(projectFolder, 'a.txt'), 'a');
      const zip = join(root, 'archive.zip');
      const dest = join(root, 'extracted');
      mkdirSync(dest, { recursive: true });
      mkdirSync(join(dest, 'fallback'), { recursive: true });

      await new ProjectCompressor().compress(
        projectFolder,
        zip,
        'fallback',
        []
      );
      const slug = await new ProjectUnzipper().unzip('fallback', zip, dest, {
        overwriteExisting: false
      });
      expect(slug).toBe('fallback-1');
      expect(existsSync(join(dest, 'fallback-1', 'a.txt'))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
