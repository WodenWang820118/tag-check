import { describe, it, expect, vi } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  existsSync,
  readFileSync,
  readdirSync,
  renameSync
} from 'fs';
import { ProjectCompressor } from './project-compressor.service';
import { ProjectUnzipper } from './project-unzipper.service';

vi.mock('fs', async (importOriginal) => {
  const fs = await importOriginal<typeof import('fs')>();
  return { ...fs, renameSync: vi.fn(fs.renameSync) };
});

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

  it.each(['', '.', '..'])(
    'rejects the slug %j instead of replacing the projects folder',
    async (badSlug) => {
      const root = mkdtempSync(join(tmpdir(), 'unzipper-'));
      try {
        const projectFolder = join(root, 'src-proj');
        mkdirSync(projectFolder, { recursive: true });
        writeFileSync(join(projectFolder, 'a.txt'), 'a');
        const zip = join(root, 'archive.zip');
        const dest = join(root, 'extracted');
        mkdirSync(join(dest, 'other-project'), { recursive: true });
        await new ProjectCompressor().compress(projectFolder, zip, 'x', []);

        await expect(
          new ProjectUnzipper().unzip(badSlug, zip, dest)
        ).rejects.toThrow('Invalid project slug');
        expect(existsSync(join(dest, 'other-project'))).toBe(true);
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    }
  );

  it.each(['incoming folder', 'backup folder'])(
    'restores the old folder when the %s restore rename fails once with EPERM',
    async (restoreFolder) => {
      const root = mkdtempSync(join(tmpdir(), 'unzipper-'));
      const { renameSync: actualRename } =
        await vi.importActual<typeof import('fs')>('fs');
      const rename = vi.mocked(renameSync);
      try {
        const projectFolder = join(root, 'src-proj');
        mkdirSync(projectFolder, { recursive: true });
        writeFileSync(join(projectFolder, 'media.txt'), 'incoming media');
        const zip = join(root, 'archive.zip');
        const dest = join(root, 'extracted');
        const finalPath = join(dest, 'same');
        mkdirSync(finalPath, { recursive: true });
        writeFileSync(join(finalPath, 'media.txt'), 'original media');
        await new ProjectCompressor().compress(projectFolder, zip, 'same', []);
        const importError = new Error('database import failed');
        const restoreError = Object.assign(new Error('folder is busy'), {
          code: 'EPERM'
        });
        const failRestore = vi.fn(() => {
          throw restoreError;
        });

        await expect(
          new ProjectUnzipper().unzip('same', zip, dest, {
            afterReplace: async () => {
              expect(readFileSync(join(finalPath, 'media.txt'), 'utf8')).toBe(
                'incoming media'
              );
              if (restoreFolder === 'backup folder') {
                rename.mockImplementationOnce(actualRename);
              }
              rename.mockImplementationOnce(failRestore);
              throw importError;
            }
          })
        ).rejects.toBe(importError);

        expect(failRestore).toHaveBeenCalledTimes(1);
        expect(readFileSync(join(finalPath, 'media.txt'), 'utf8')).toBe(
          'original media'
        );
        expect(readdirSync(dest)).toEqual(['same']);
      } finally {
        rename.mockReset().mockImplementation(actualRename);
        rmSync(root, { recursive: true, force: true });
      }
    }
  );

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
