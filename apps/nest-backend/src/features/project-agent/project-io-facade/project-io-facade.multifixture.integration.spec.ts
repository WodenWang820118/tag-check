import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import {
  createProjectIoFacadeHarness,
  type JsonProjectImportServiceMock,
  type ProjectIoFacadeHarness,
  type ProjectIoServiceStub
} from './project-io-facade.spec-helpers';

interface ImportedFixture {
  note: string;
}

function createMultiFixtureProjectIoService(): ProjectIoServiceStub {
  return {
    async compressProject() {
      /* noop */
    },

    async unzipProject(slug: string, _zip: string, output: string) {
      const folder = join(output, slug);
      mkdirSync(folder, { recursive: true });
      const fixtures = ['zz.fixture.json', 'aa.fixture.json'];
      for (const fixture of fixtures) {
        writeFileSync(
          join(folder, fixture),
          JSON.stringify({ version: 1, entities: {}, note: fixture }),
          'utf-8'
        );
      }
      return slug;
    }
  };
}

describe('ProjectIoFacadeService multi-fixture selection', () => {
  let harness: ProjectIoFacadeHarness;
  let importSvc: JsonProjectImportServiceMock;

  beforeEach(async () => {
    harness = await createProjectIoFacadeHarness({
      projectIoService: createMultiFixtureProjectIoService()
    });
    importSvc = harness.jsonImportService;
  });

  afterEach(() => {
    harness.cleanup();
  });

  it('picks alphabetically first fixture', async () => {
    const slug = 'multi';
    const finalSlug = await harness.service.importProject(
      slug,
      'dummy.zip',
      harness.tempRoot
    );
    expect(finalSlug).toBe(slug);
    expect(importSvc.imported).toBeTruthy();
    const imported = importSvc.imported as ImportedFixture;
    expect(imported.note).toBe('aa.fixture.json');
    expect(existsSync(join(harness.tempRoot, slug, 'aa.fixture.json'))).toBe(
      true
    );
    expect(existsSync(join(harness.tempRoot, slug, 'zz.fixture.json'))).toBe(
      true
    );
  });
});
