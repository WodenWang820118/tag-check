import { StreamableFile } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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
    const fixture = join(harness.tempRoot, 'temp', `${slug}.fixture.json`);
    expect(existsSync(fixture)).toBe(true);
  });

  it('should unzip and import fixture if present', async () => {
    const slug = 'proj2';
    // Do NOT pre-create the slug folder; mock unzip will create staging + fixture and move into place.
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

  it('should resolve slug conflicts by appending a numeric suffix', async () => {
    const slug = 'proj-conflict';
    // Pre-create an existing project folder to cause conflict
    mkdirSync(join(harness.tempRoot, slug), { recursive: true });
    // Prepare a mock zip extraction (the mock will stage and rename)
    const importedSlug = await harness.service.importProject(
      slug,
      'dummy.zip',
      harness.tempRoot
    );
    expect(importedSlug).not.toBe(slug); // Should have been suffixed (likely -1)
    expect(importedSlug.startsWith(slug)).toBe(true);
    // Import should still have occurred using the original fixture filename (slug.fixture.json)
    expect(importMock.imported).toBeTruthy();
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
