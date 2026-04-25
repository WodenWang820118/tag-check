import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, afterEach, expect } from 'vitest';
import {
  createProjectIoFacadeHarness,
  type ProjectIoFacadeHarness,
  type ProjectIoServiceStub
} from './project-io-facade.spec-helpers';

interface ImportedFixture {
  note: string;
}

interface FixtureFile {
  name: string;
  payload: unknown;
}

function createFixtureScanProjectIoService(
  fixtures: FixtureFile[]
): ProjectIoServiceStub {
  return {
    async compressProject() {
      /* noop */
    },

    async unzipProject(slug: string, _zip: string, output: string) {
      const folder = join(output, slug);
      mkdirSync(folder, { recursive: true });
      for (const fixture of fixtures) {
        writeFileSync(
          join(folder, fixture.name),
          JSON.stringify(fixture.payload),
          'utf-8'
        );
      }
      return slug;
    }
  };
}

describe('ProjectIoFacadeService fixture scanning', () => {
  let harness: ProjectIoFacadeHarness | null = null;

  afterEach(() => {
    harness?.cleanup();
    harness = null;
  });

  async function setupWithFixtures(fixtures: FixtureFile[]) {
    harness = await createProjectIoFacadeHarness({
      projectIoService: createFixtureScanProjectIoService(fixtures)
    });
    return {
      harness,
      importSvc: harness.jsonImportService
    };
  }

  it('picks alphabetically first fixture', async () => {
    const { harness, importSvc } = await setupWithFixtures([
      {
        name: 'zz.fixture.json',
        payload: { version: 1, entities: {}, note: 'zz.fixture.json' }
      },
      {
        name: 'aa.fixture.json',
        payload: { version: 1, entities: {}, note: 'aa.fixture.json' }
      }
    ]);

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

  it('skips JSON import when the extracted folder has no fixture', async () => {
    const { harness, importSvc } = await setupWithFixtures([]);

    const slug = 'empty';
    const finalSlug = await harness.service.importProject(
      slug,
      'dummy.zip',
      harness.tempRoot
    );

    expect(finalSlug).toBe(slug);
    expect(existsSync(join(harness.tempRoot, slug))).toBe(true);
    expect(importSvc.imported).toBe(null);
    expect(importSvc.importCalls).toHaveLength(0);
  });
});
