import { Test } from '@nestjs/testing';
import { ProjectIoFacadeService } from './project-io-facade.service';
import { ProjectIoService } from '../../../infrastructure/os/project-io/project-io.service';
import { FolderPathService } from '../../../infrastructure/os/path/folder-path/folder-path.service';
import { FolderService } from '../../../infrastructure/os/folder/folder.service';
import { JsonProjectExportService } from '../../../infrastructure/data-export/json/json-project-export.service';
import { JsonProjectImportService } from '../../../infrastructure/data-export/json/json-project-import.service';
import { StreamableFile } from '@nestjs/common';
import { writeFileSync, existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { describe, it, expect, beforeEach } from 'vitest';

// Simple in-memory temp root
const tempRoot = join(process.cwd(), 'tmp-facade-test');

class FolderPathServiceMock {
  async getProjectFolderPath(slug: string) {
    return join(tempRoot, slug);
  }
  async getRootProjectFolderPath() {
    return tempRoot;
  }
}

class FolderServiceMock {
  deleteFolder(path: string) {
    try {
      rmSync(path, { recursive: true, force: true });
    } catch {
      /* ignore cleanup errors */
    }
  }
}

class ProjectIoServiceMock {
  async compressProject(
    projectFolderPath: string,
    outputPath: string,
    _slug: string,
    extraFiles: { path: string; name?: string }[]
  ) {
    // Simulate zip by writing a manifest file listing files (including extra)
    const manifest = {
      projectFolderPath,
      files: extraFiles.map((f) => f.name)
    };
    writeFileSync(outputPath, JSON.stringify(manifest), 'utf-8');
  }
  async unzipProject(slug: string, zipPath: string, output: string) {
    // Simulate creation of staging dir with fixture file then conflict resolution
    // We'll mimic new logic: always create staging dir then move to unique slug
    const staging = join(
      output,
      `_import_tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    );
    mkdirSync(staging, { recursive: true });
    // Add a fixture to allow slug inference
    const fixtureName = `${slug}.fixture.json`;
    writeFileSync(
      join(staging, fixtureName),
      JSON.stringify({
        version: 1,
        exportedAt: new Date().toISOString(),
        schemaHash: 'x',
        projectSlug: slug,
        entities: { ProjectEntity: [] }
      }),
      'utf-8'
    );
    let candidate = slug;
    let counter = 1;
    while (existsSync(join(output, candidate))) {
      candidate = `${slug}-${counter++}`;
    }
    // Instead of renaming (which can trigger EPERM on Windows CI), just create final folder and write fixture directly
    const finalDir = join(output, candidate);
    mkdirSync(finalDir, { recursive: true });
    writeFileSync(
      join(finalDir, fixtureName),
      JSON.stringify({
        version: 1,
        exportedAt: new Date().toISOString(),
        schemaHash: 'x',
        projectSlug: slug,
        entities: { ProjectEntity: [] }
      }),
      'utf-8'
    );
    // Clean up staging
    rmSync(staging, { recursive: true, force: true });
    return candidate;
  }
}

class JsonProjectExportServiceMock {
  async exportProject(slug: string) {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      schemaHash: 'x',
      projectSlug: slug,
      entities: { ProjectEntity: [{ id: 1, projectSlug: slug }] }
    };
  }
}
class JsonProjectImportServiceMock {
  imported: unknown = null;
  async importProject(payload: unknown) {
    this.imported = payload;
  }
}

describe('ProjectIoFacadeService', () => {
  let service: ProjectIoFacadeService;
  let importMock: JsonProjectImportServiceMock;

  beforeEach(async () => {
    rmSync(tempRoot, { recursive: true, force: true });
    mkdirSync(tempRoot, { recursive: true });
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectIoFacadeService,
        { provide: ProjectIoService, useClass: ProjectIoServiceMock },
        { provide: FolderPathService, useClass: FolderPathServiceMock },
        { provide: FolderService, useClass: FolderServiceMock },
        {
          provide: JsonProjectExportService,
          useClass: JsonProjectExportServiceMock
        },
        {
          provide: JsonProjectImportService,
          useClass: JsonProjectImportServiceMock
        }
      ]
    }).compile();

    service = moduleRef.get(ProjectIoFacadeService);
    importMock = moduleRef.get(JsonProjectImportService);
  });

  it('should export a project including fixture file', async () => {
    const slug = 'proj1';
    // prepare project folder
    mkdirSync(join(tempRoot, slug), { recursive: true });
    const stream = await service.exportProject(slug);
    expect(stream).toBeInstanceOf(StreamableFile);
    const tempDir =
      await new FolderPathServiceMock().getRootProjectFolderPath();
    // The fixture file should exist before cleanup (zip creation done)
    const fixture = join(tempDir, 'temp', `${slug}.fixture.json`);
    expect(existsSync(fixture)).toBe(true);
  });

  it('should unzip and import fixture if present', async () => {
    const slug = 'proj2';
    // Do NOT pre-create the slug folder; mock unzip will create staging + fixture and move into place.
    const importedSlug = await service.importProject(
      slug,
      'dummy.zip',
      tempRoot
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
    mkdirSync(join(tempRoot, slug), { recursive: true });
    // Prepare a mock zip extraction (the mock will stage and rename)
    const importedSlug = await service.importProject(
      slug,
      'dummy.zip',
      tempRoot
    );
    expect(importedSlug).not.toBe(slug); // Should have been suffixed (likely -1)
    expect(importedSlug.startsWith(slug)).toBe(true);
    // Import should still have occurred using the original fixture filename (slug.fixture.json)
    expect(importMock.imported).toBeTruthy();
  });
});
