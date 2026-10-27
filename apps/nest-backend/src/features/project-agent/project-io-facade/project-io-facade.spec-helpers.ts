import { Test } from '@nestjs/testing';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ProjectIoService } from '../../../infrastructure/os/project-io/project-io.service';
import { ProjectCompressor } from '../../../infrastructure/os/project-io/project-compressor.service';
import { ProjectUnzipper } from '../../../infrastructure/os/project-io/project-unzipper.service';
import { FolderPathService } from '../../../infrastructure/os/path/folder-path/folder-path.service';
import { FolderService } from '../../../infrastructure/os/folder/folder.service';
import { JsonProjectExportService } from '../../../infrastructure/data-export/json/export/json-project-export.service';
import { JsonProjectImportService } from '../../../infrastructure/data-export/json/import/json-project-import.service';
import type { FixtureEnvelopeV1 } from '../../../infrastructure/data-export/interfaces/fixture-types';
import { ProjectIoFacadeService } from './project-io-facade.service';

export type ProjectIoServiceStub = Pick<
  ProjectIoService,
  'compressProject' | 'unzipProject'
>;

type JsonProjectExportServiceStub = Pick<
  JsonProjectExportService,
  'exportProject'
>;

export class FolderServiceMock {
  deletedPaths: string[] = [];

  deleteFolder(path: string) {
    this.deletedPaths.push(path);
    rmSync(path, { recursive: true, force: true });
  }
}

export class JsonProjectImportServiceMock {
  imported: unknown = null;
  importCalls: unknown[] = [];
  /** When set, importProject rejects with it. */
  failWith: Error | null = null;

  validate(payload: unknown) {
    return payload;
  }

  async importProject(payload: unknown) {
    this.importCalls.push(payload);
    if (this.failWith) throw this.failWith;
    this.imported = payload;
  }
}

export class JsonProjectExportServiceMock {
  async exportProject(slug: string): Promise<FixtureEnvelopeV1> {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      schemaHash: 'x',
      projectSlug: slug,
      entities: { ProjectEntity: [{ id: 1, projectSlug: slug }] }
    };
  }
}

export interface ProjectIoFacadeHarnessOptions {
  projectIoService?: ProjectIoServiceStub;
  folderService?: FolderServiceMock;
  jsonExportService?: JsonProjectExportServiceStub;
  jsonImportService?: JsonProjectImportServiceMock;
  tempRootPrefix?: string;
}

export interface ProjectIoFacadeHarness {
  service: ProjectIoFacadeService;
  tempRoot: string;
  projectIoService: ProjectIoServiceStub;
  folderService: FolderServiceMock;
  jsonExportService: JsonProjectExportServiceStub;
  jsonImportService: JsonProjectImportServiceMock;
  cleanup: () => void;
}

export async function createProjectIoFacadeHarness(
  options: ProjectIoFacadeHarnessOptions = {}
): Promise<ProjectIoFacadeHarness> {
  const tempRoot = mkdtempForHarness(options.tempRootPrefix);

  const folderPathService = {
    async getProjectFolderPath(slug: string) {
      return join(tempRoot, slug);
    },
    async getRootProjectFolderPath() {
      return tempRoot;
    }
  };

  const projectIoService =
    options.projectIoService ?? createDefaultProjectIoService();
  const folderService = options.folderService ?? new FolderServiceMock();
  const jsonExportService =
    options.jsonExportService ?? new JsonProjectExportServiceMock();
  const jsonImportService =
    options.jsonImportService ?? new JsonProjectImportServiceMock();

  const moduleRef = await Test.createTestingModule({
    providers: [
      ProjectIoFacadeService,
      { provide: ProjectIoService, useValue: projectIoService },
      { provide: FolderPathService, useValue: folderPathService },
      { provide: FolderService, useValue: folderService },
      { provide: JsonProjectExportService, useValue: jsonExportService },
      { provide: JsonProjectImportService, useValue: jsonImportService }
    ]
  }).compile();

  return {
    service: moduleRef.get(ProjectIoFacadeService),
    tempRoot,
    projectIoService,
    folderService,
    jsonExportService,
    jsonImportService,
    cleanup: () => rmSync(tempRoot, { recursive: true, force: true })
  };
}

function mkdtempForHarness(prefix = 'tag-check-facade-') {
  return mkdtempSync(join(process.cwd(), prefix));
}

function createDefaultProjectIoService(): ProjectIoServiceStub {
  return {
    async compressProject(
      projectFolderPath: string,
      outputPath: string,
      _slug: string,
      extraFiles: { path: string; name?: string }[]
    ) {
      const manifest = {
        projectFolderPath,
        files: extraFiles.map((file) => file.name)
      };
      writeFileSync(outputPath, JSON.stringify(manifest), 'utf-8');
    },

    async unzipProject(slug, _zipPath, output, options) {
      const source = mkdtempSync(join(output, 'input-'));
      try {
        const content = join(source, 'content');
        mkdirSync(content);
        writeFixture(join(content, `${slug}.fixture.json`), slug);
        const archive = join(source, 'archive.zip');
        await new ProjectCompressor().compress(content, archive, slug);
        return await new ProjectUnzipper().unzip(
          slug,
          archive,
          output,
          options
        );
      } finally {
        rmSync(source, { recursive: true, force: true });
      }
    }
  };
}

function writeFixture(path: string, slug: string) {
  writeFileSync(
    path,
    JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      schemaHash: 'x',
      projectSlug: slug,
      entities: { ProjectEntity: [{ id: 1, projectSlug: slug }] }
    }),
    'utf-8'
  );
}
