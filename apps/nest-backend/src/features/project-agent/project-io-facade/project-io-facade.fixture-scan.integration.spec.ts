import { mkdirSync, writeFileSync, existsSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { describe, it, afterEach, expect } from 'vitest';
import {
  createProjectIoFacadeHarness,
  type ProjectIoFacadeHarness
} from './project-io-facade.spec-helpers';
import { ProjectIoService } from '../../../infrastructure/os/project-io/project-io.service';
import { ProjectCompressor } from '../../../infrastructure/os/project-io/project-compressor.service';
import { ProjectUnzipper } from '../../../infrastructure/os/project-io/project-unzipper.service';

interface ImportedFixture {
  note: string;
}

interface FixtureFile {
  name: string;
  payload: unknown;
}

describe('ProjectIoFacadeService fixture scanning', () => {
  let harness: ProjectIoFacadeHarness | null = null;

  afterEach(() => {
    harness?.cleanup();
    harness = null;
  });

  async function setupWithFixtures(fixtures: FixtureFile[]) {
    harness = await createProjectIoFacadeHarness({
      projectIoService: new ProjectIoService(
        new ProjectCompressor(),
        new ProjectUnzipper()
      )
    });
    const input = mkdtempSync(join(harness.tempRoot, 'input-'));
    const content = join(input, 'content');
    mkdirSync(content);
    for (const fixture of fixtures) {
      writeFileSync(
        join(content, fixture.name),
        JSON.stringify(fixture.payload)
      );
    }
    const zip = join(input, 'archive.zip');
    await new ProjectCompressor().compress(content, zip, 'upload');
    return {
      harness,
      zip,
      importSvc: harness.jsonImportService
    };
  }

  it('picks alphabetically first fixture', async () => {
    const { harness, importSvc, zip } = await setupWithFixtures([
      {
        name: 'zz.fixture.json',
        payload: {
          version: 1,
          projectSlug: 'zz',
          entities: { ProjectEntity: [{ projectSlug: 'zz' }] },
          note: 'zz.fixture.json'
        }
      },
      {
        name: 'aa.fixture.json',
        payload: {
          version: 1,
          projectSlug: 'aa',
          entities: { ProjectEntity: [{ projectSlug: 'aa' }] },
          note: 'aa.fixture.json'
        }
      }
    ]);

    const slug = 'multi';
    const finalSlug = await harness.service.importProject(
      slug,
      zip,
      harness.tempRoot
    );
    expect(finalSlug).toBe('aa');
    expect(importSvc.imported).toBeTruthy();
    const imported = importSvc.imported as ImportedFixture;
    expect(imported.note).toBe('aa.fixture.json');
    expect(
      existsSync(join(harness.tempRoot, finalSlug, 'aa.fixture.json'))
    ).toBe(true);
    expect(
      existsSync(join(harness.tempRoot, finalSlug, 'zz.fixture.json'))
    ).toBe(true);
  });

  it('skips JSON import when the extracted folder has no fixture', async () => {
    const { harness, importSvc, zip } = await setupWithFixtures([]);

    const slug = 'empty';
    const finalSlug = await harness.service.importProject(
      slug,
      zip,
      harness.tempRoot
    );

    expect(finalSlug).toBe(slug);
    expect(existsSync(join(harness.tempRoot, slug))).toBe(true);
    expect(importSvc.imported).toBe(null);
    expect(importSvc.importCalls).toHaveLength(0);
  });
});
