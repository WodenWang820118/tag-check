import {
  BadRequestException,
  InternalServerErrorException,
  StreamableFile
} from '@nestjs/common';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createProjectIoFacadeHarness,
  type FolderServiceMock,
  type JsonProjectImportServiceMock,
  type ProjectIoFacadeHarness
} from './project-io-facade.spec-helpers';

describe('ProjectIoFacadeService', () => {
  let harness: ProjectIoFacadeHarness;
  let importMock: JsonProjectImportServiceMock;
  let folderMock: FolderServiceMock;

  beforeEach(async () => {
    harness = await createProjectIoFacadeHarness();
    importMock = harness.jsonImportService;
    folderMock = harness.folderService;
  });

  afterEach(() => {
    harness.cleanup();
  });

  it('should export a project including fixture file', async () => {
    const slug = 'proj1';
    // prepare project folder
    mkdirSync(join(harness.tempRoot, slug), { recursive: true });
    const stream = await harness.service.exportProject(slug);
    expect(stream).toBeInstanceOf(StreamableFile);
    // The fixture file should exist before cleanup (zip creation done)
    const tempFolder = readdirSync(harness.tempRoot).find((entry) =>
      entry.startsWith('_export_tmp_')
    );
    if (!tempFolder) throw new Error('Export staging folder missing');
    const fixture = join(harness.tempRoot, tempFolder, `${slug}.fixture.json`);
    expect(existsSync(fixture)).toBe(true);
    for await (const chunk of stream.getStream())
      expect(chunk.length).toBeGreaterThan(0);
  });

  it('should unzip and import fixture if present', async () => {
    const slug = 'proj2';
    const importedSlug = await harness.service.importProject(
      slug,
      'dummy.zip',
      harness.tempRoot
    );
    expect(importedSlug).toBe(slug);
    expect(importMock.imported).toBeTruthy();
    const importedPayload = importMock.imported as {
      projectSlug?: string;
    } | null;
    expect(importedPayload?.projectSlug).toBe(slug);
  });

  it.each(['fixture', 'compression'])(
    'removes its temporary directory when %s export fails',
    async (failure) => {
      const projectFolder = join(harness.tempRoot, 'existing');
      mkdirSync(projectFolder);
      writeFileSync(join(projectFolder, 'recording.webm'), 'media');
      if (failure === 'fixture') {
        vi.spyOn(
          harness.jsonExportService,
          'exportProject'
        ).mockRejectedValueOnce(new Error('fixture failure'));
      } else {
        vi.spyOn(
          harness.projectIoService,
          'compressProject'
        ).mockRejectedValueOnce(new Error('compression failure'));
      }
      await expect(harness.service.exportProject('existing')).rejects.toThrow(
        `${failure} failure`
      );
      expect(readdirSync(harness.tempRoot)).toEqual(['existing']);
      expect(existsSync(join(projectFolder, 'recording.webm'))).toBe(true);
    }
  );

  it('replaces the existing folder using the fixture projectSlug', async () => {
    const slug = 'proj-conflict';
    mkdirSync(join(harness.tempRoot, slug), { recursive: true });
    const importedSlug = await harness.service.importProject(
      slug,
      'dummy.zip',
      harness.tempRoot
    );
    // Suffixing only the folder would split it from the database project.
    expect(importedSlug).toBe(slug);
    expect(importMock.imported).toBeTruthy();
  });

  it('reports a failed data import instead of answering as if it succeeded', async () => {
    importMock.failWith = new Error('SQLITE_CONSTRAINT');

    await expect(
      harness.service.importProject('proj-fail', 'dummy.zip', harness.tempRoot)
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('rejects a fixture that is not JSON as a bad request', async () => {
    harness.projectIoService.unzipProject = async (
      slug,
      _zip,
      output,
      options
    ) => {
      mkdirSync(join(output, slug), { recursive: true });
      writeFileSync(join(output, slug, `${slug}.fixture.json`), '{not json');
      return options?.validateStaged?.(join(output, slug)) ?? slug;
    };

    await expect(
      harness.service.importProject('proj-bad', 'dummy.zip', harness.tempRoot)
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(importMock.importCalls).toEqual([]);
  });

  it('should delete the resolved project folder', async () => {
    const slug = 'proj-delete';
    const projectFolder = join(harness.tempRoot, slug);
    mkdirSync(projectFolder, { recursive: true });

    await harness.service.deleteProject(slug);

    expect(folderMock.deletedPaths).toEqual([projectFolder]);
    expect(existsSync(projectFolder)).toBe(false);
  });
});
