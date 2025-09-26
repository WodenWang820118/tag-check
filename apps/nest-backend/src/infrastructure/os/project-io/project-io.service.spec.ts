import { describe, it, beforeEach, expect } from 'vitest';
import { ProjectIoService } from './project-io.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectCompressor } from './project-compressor.service';
import { ProjectUnzipper } from './project-unzipper.service';
import {
  mkdirSync,
  rmSync,
  writeFileSync,
  existsSync,
  createWriteStream
} from 'fs';
import { join } from 'path';
import archiver from 'archiver';

// Helper to build a zip with optional fixture file
async function createZip(
  baseDir: string,
  name: string,
  files: { path: string; data: string }[]
) {
  const zipPath = join(baseDir, `${name}.zip`);
  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', () => resolve());
    output.on('error', (e) => reject(e));
    archive.on('error', (e) => reject(e));
    archive.pipe(output);
    for (const f of files) {
      const full = join(baseDir, f.path);
      writeFileSync(full, f.data, 'utf-8');
      archive.file(full, { name: f.path });
    }
    archive.finalize().catch(reject);
  });
  return zipPath;
}

describe('ProjectIoService unzipProject', () => {
  const root = join(process.cwd(), 'tmp-project-io-tests');
  const output = root; // use same
  let service: ProjectIoService;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    rmSync(root, { recursive: true, force: true });
    mkdirSync(root, { recursive: true });
    moduleRef = await Test.createTestingModule({
      providers: [ProjectIoService, ProjectCompressor, ProjectUnzipper]
    }).compile();
    service = moduleRef.get(ProjectIoService);
  });

  it('extracts to provided slug when no conflicts and no fixture', async () => {
    const zip = await createZip(root, 'plain', [
      { path: 'readme.txt', data: 'hello' }
    ]);
    const slug = await service.unzipProject('plain', zip, output);
    expect(slug).toBe('plain');
    expect(existsSync(join(output, slug, 'readme.txt'))).toBe(true);
  });

  it('overwrites existing folder when slug exists (default overwrite)', async () => {
    const existingDir = join(output, 'dup');
    mkdirSync(existingDir, { recursive: true });
    writeFileSync(join(existingDir, 'old.txt'), 'old');
    const zip = await createZip(root, 'dup', [{ path: 'file.txt', data: 'x' }]);
    const slug = await service.unzipProject('dup', zip, output); // default overwrite
    expect(slug).toBe('dup');
    expect(existsSync(join(output, slug, 'file.txt'))).toBe(true);
    expect(existsSync(join(output, slug, 'old.txt'))).toBe(false); // overwritten
  });

  it('uses slug inferred from fixture filename', async () => {
    const zip = await createZip(root, 'any', [
      {
        path: 'inferred.fixture.json',
        data: JSON.stringify({ version: 1, entities: { ProjectEntity: [] } })
      }
    ]);
    const slug = await service.unzipProject('provided-slug', zip, output);
    expect(slug).toBe('inferred');
    expect(existsSync(join(output, 'inferred'))).toBe(true);
  });

  it('overwrites inferred slug when it already exists (default overwrite)', async () => {
    const existing = join(output, 'projectx');
    mkdirSync(existing, { recursive: true });
    writeFileSync(join(existing, 'legacy.txt'), 'legacy');
    const zip = await createZip(root, 'any2', [
      {
        path: 'projectx.fixture.json',
        data: JSON.stringify({ version: 1, entities: { ProjectEntity: [] } })
      }
    ]);
    const slug = await service.unzipProject('other', zip, output);
    expect(slug).toBe('projectx');
    expect(existsSync(join(output, slug, 'legacy.txt'))).toBe(false);
  });

  it('overwrites provided slug folder when no fixture and slug conflicts (default overwrite)', async () => {
    const target = join(output, 'base');
    mkdirSync(target, { recursive: true });
    writeFileSync(join(target, 'obsolete.txt'), 'obsolete');
    const zip = await createZip(root, 'zipbase', [
      { path: 'file.txt', data: 'y' }
    ]);
    const slug = await service.unzipProject('base', zip, output);
    expect(slug).toBe('base');
    expect(existsSync(join(output, slug, 'obsolete.txt'))).toBe(false);
  });

  it('preserves suffixing behavior when overwrite disabled', async () => {
    mkdirSync(join(output, 'multi'), { recursive: true });
    mkdirSync(join(output, 'multi-1'), { recursive: true });
    const zip = await createZip(root, 'multi', [
      { path: 'another.txt', data: 'z' }
    ]);
    const slug = await service.unzipProject('multi', zip, output, {
      overwriteExisting: false
    });
    expect(slug).toBe('multi-2');
    expect(existsSync(join(output, slug, 'another.txt'))).toBe(true);
  });

  it('suffixes inferred slug when overwrite disabled', async () => {
    mkdirSync(join(output, 'inf'), { recursive: true });
    const zip = await createZip(root, 'any3', [
      {
        path: 'inf.fixture.json',
        data: JSON.stringify({ version: 1, entities: { ProjectEntity: [] } })
      }
    ]);
    const slug = await service.unzipProject('ignored', zip, output, {
      overwriteExisting: false
    });
    expect(slug).toBe('inf-1');
  });
});
