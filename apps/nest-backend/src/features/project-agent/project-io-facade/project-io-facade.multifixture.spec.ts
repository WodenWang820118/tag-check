import { Test } from '@nestjs/testing';
import { ProjectIoFacadeService } from './project-io-facade.service';
import { ProjectIoService } from '../../../infrastructure/os/project-io/project-io.service';
import { FolderPathService } from '../../../infrastructure/os/path/folder-path/folder-path.service';
import { FolderService } from '../../../infrastructure/os/folder/folder.service';
import { JsonProjectExportService } from '../../../infrastructure/data-export/json/export/json-project-export.service';
import { JsonProjectImportService } from '../../../infrastructure/data-export/json/import/json-project-import.service';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, beforeEach, expect } from 'vitest';

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
      /* ignore */
    }
  }
}

class ProjectIoServiceMock {
  async compressProject() {
    /* noop */
  }
  async unzipProject(slug: string, _zip: string, output: string) {
    // Simulate extraction to possibly suffixed folder (no conflict => same slug)
    const folder = join(output, slug);
    mkdirSync(folder, { recursive: true });
    // create two fixture files out of order deliberately
    const fixtures = ['zz.fixture.json', 'aa.fixture.json'];
    for (const f of fixtures) {
      writeFileSync(
        join(folder, f),
        JSON.stringify({ version: 1, entities: {}, note: f }),
        'utf-8'
      );
    }
    return slug; // final slug
  }
}
class JsonProjectImportServiceMock {
  imported: unknown;
  async importProject(p: unknown) {
    this.imported = p;
  }
}

interface ImportedFixture {
  note: string;
}
class JsonProjectExportServiceMock {
  async exportProject() {
    return { version: 1, entities: {} };
  }
}

describe('ProjectIoFacadeService multi-fixture selection', () => {
  let service: ProjectIoFacadeService;
  let importSvc: JsonProjectImportServiceMock;
  beforeEach(async () => {
    rmSync(tempRoot, { recursive: true, force: true });
    mkdirSync(tempRoot, { recursive: true });
    const mod = await Test.createTestingModule({
      providers: [
        ProjectIoFacadeService,
        { provide: ProjectIoService, useClass: ProjectIoServiceMock },
        { provide: FolderPathService, useClass: FolderPathServiceMock },
        { provide: FolderService, useClass: FolderServiceMock },
        {
          provide: JsonProjectImportService,
          useClass: JsonProjectImportServiceMock
        },
        {
          provide: JsonProjectExportService,
          useClass: JsonProjectExportServiceMock
        }
      ]
    }).compile();
    service = mod.get(ProjectIoFacadeService);
    importSvc = mod.get(JsonProjectImportService);
  });

  it('picks alphabetically first fixture', async () => {
    const slug = 'multi';
    const finalSlug = await service.importProject(slug, 'dummy.zip', tempRoot);
    expect(finalSlug).toBe(slug);
    expect(importSvc.imported).toBeTruthy();
    // imported payload should correspond to aa.fixture.json selection
    const imported = importSvc.imported as ImportedFixture;
    expect(imported.note).toBe('aa.fixture.json');
    // ensure both fixtures exist still
    expect(existsSync(join(tempRoot, slug, 'aa.fixture.json'))).toBe(true);
    expect(existsSync(join(tempRoot, slug, 'zz.fixture.json'))).toBe(true);
  });
});
