import { Test, type TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { type StreamableFile } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EventEmitter, once } from 'node:events';
import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import { Open } from 'unzipper';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DATABASE_ENTITIES } from '../../../core/database/database-entities';
import { ProjectEntity } from '../../../shared';
import { JsonImportModule } from '../../../infrastructure/data-export/json/import/json-import.module';
import { JsonProjectExportService } from '../../../infrastructure/data-export/json/export/json-project-export.service';
import { JsonProjectImportService } from '../../../infrastructure/data-export/json/import/json-project-import.service';
import { PointerRepairService } from '../../../infrastructure/data-export/json/core/pointer-repair.service';
import { ProjectIoModule } from '../../../infrastructure/os/project-io/project-io.module';
import { ProjectIoService } from '../../../infrastructure/os/project-io/project-io.service';
import { ProjectCompressor } from '../../../infrastructure/os/project-io/project-compressor.service';
import { FolderPathService } from '../../../infrastructure/os/path/folder-path/folder-path.service';
import { FolderService } from '../../../infrastructure/os/folder/folder.service';
import { ProjectIoFacadeService } from './project-io-facade.service';

function fixture(projectSlug = 'existing') {
  return {
    version: 1,
    exportedAt: '2026-10-27T00:00:00.000Z',
    schemaHash: 'test',
    projectSlug,
    entities: {
      ProjectEntity: [{ id: 100, projectSlug, projectName: 'Imported' }]
    }
  };
}

async function readZip(file: StreamableFile) {
  const stream = file.getStream();
  const closed = once(stream, 'close');
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  await closed;
  const zip = await Open.buffer(Buffer.concat(chunks));
  return Object.fromEntries(
    await Promise.all(
      zip.files.map(async (entry) => [entry.path, await entry.buffer()])
    )
  );
}

describe('ProjectIoFacadeService safety', () => {
  let root: string;
  let projects: string;
  let moduleRef: TestingModule;
  let service: ProjectIoFacadeService;
  let database: DataSource;

  beforeEach(async () => {
    root = mkdtempSync(join(process.cwd(), '.project-io-safety-'));
    projects = join(root, 'projects');
    mkdirSync(join(projects, 'existing'), { recursive: true });
    writeFileSync(
      join(projects, 'existing', 'recording.webm'),
      'original media'
    );
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: DATABASE_ENTITIES,
          synchronize: true,
          dropSchema: true
        }),
        JsonImportModule,
        ProjectIoModule
      ],
      providers: [
        ProjectIoFacadeService,
        JsonProjectExportService,
        FolderService,
        {
          provide: FolderPathService,
          useValue: {
            getProjectFolderPath: async (slug: string) => join(projects, slug),
            getRootProjectFolderPath: async () => projects
          }
        }
      ]
    }).compile();
    service = moduleRef.get(ProjectIoFacadeService);
    database = moduleRef.get(DataSource);
    await database.getRepository(ProjectEntity).save({
      projectSlug: 'existing',
      projectName: 'Original'
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await moduleRef?.close();
    rmSync(root, { recursive: true, force: true });
  });

  async function archive(payload: unknown, name = 'existing.fixture.json') {
    const source = mkdtempSync(join(root, 'source-'));
    writeFileSync(join(source, name), JSON.stringify(payload));
    writeFileSync(join(source, 'recording.webm'), 'incoming media');
    const zipPath = join(root, `${randomUUID()}.zip`);
    await moduleRef.get(ProjectCompressor).compress(source, zipPath, 'upload');
    return zipPath;
  }

  async function expectOriginal(rows: ProjectEntity[]) {
    expect(await database.getRepository(ProjectEntity).find()).toEqual(rows);
    expect(existsSync(join(projects, 'existing', 'recording.webm'))).toBe(true);
    expect(
      readFileSync(join(projects, 'existing', 'recording.webm'), 'utf8')
    ).toBe('original media');
    expect(readdirSync(projects)).toEqual(['existing']);
  }

  it.each([
    ['unsupported version', { ...fixture(), version: 2 }],
    ['missing entities', { ...fixture(), entities: undefined }],
    [
      'malformed entities',
      { ...fixture(), entities: { ProjectEntity: 'invalid' } }
    ],
    ['unsafe slug', { ...fixture(), projectSlug: '..' }],
    [
      'different project row slug',
      { ...fixture(), entities: fixture('other').entities }
    ]
  ])(
    'rejects a same-slug import with %s before touching rows or media',
    async (_reason, payload) => {
      const rows = await database.getRepository(ProjectEntity).find();
      const zip = await archive(payload);
      await expect(
        service.importProject('existing', zip, projects)
      ).rejects.toMatchObject({ status: 400 });
      await expectOriginal(rows);
    }
  );

  it('rejects a fixture filename that disagrees with projectSlug without changing either project', async () => {
    const rows = await database.getRepository(ProjectEntity).find();
    const zip = await archive(fixture(), 'other.fixture.json');
    await expect(
      service.importProject('upload', zip, projects)
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringMatching(/fixture.*name.*projectSlug/i)
    });
    await expectOriginal(rows);
  });

  it('restores the old folder and rows when a database import fails after writing rows', async () => {
    const rows = await database.getRepository(ProjectEntity).find();
    const zip = await archive(fixture());
    vi.spyOn(
      moduleRef.get(PointerRepairService),
      'repairPointers'
    ).mockImplementation(async (runner) => {
      const updated = await runner.manager
        .getRepository(ProjectEntity)
        .findOneByOrFail({ projectSlug: 'existing' });
      expect(updated.projectName).toBe('Imported');
      throw new Error('database failure after project update');
    });
    await expect(
      service.importProject('upload', zip, projects)
    ).rejects.toMatchObject({ status: 500 });
    await expectOriginal(rows);
  });

  it('commits matching rows and media under the JSON slug, regardless of upload name', async () => {
    const zip = await archive(fixture());
    await expect(service.importProject('upload', zip, projects)).resolves.toBe(
      'existing'
    );
    expect(
      (
        await database
          .getRepository(ProjectEntity)
          .findOneByOrFail({ projectSlug: 'existing' })
      ).projectName
    ).toBe('Imported');
    expect(
      readFileSync(join(projects, 'existing', 'recording.webm'), 'utf8')
    ).toBe('incoming media');
    expect(readdirSync(projects)).toEqual(['existing']);
  });

  it('finishes a failing import rollback before publishing an overlapping import of the same slug', async () => {
    const firstArchive = await archive(fixture());
    const replacement = fixture();
    replacement.entities.ProjectEntity[0].projectName = 'Second import';
    const secondArchive = await archive(replacement);
    const gate = new EventEmitter();
    const firstEntered = once(gate, 'first-entered');
    const secondStaged = once(gate, 'second-staged');
    const released = once(gate, 'release');
    const repairer = moduleRef.get(PointerRepairService);
    const repair = repairer.repairPointers.bind(repairer);
    let imports = 0;
    vi.spyOn(repairer, 'repairPointers').mockImplementation(async (...args) => {
      if (++imports === 1) {
        gate.emit('first-entered');
        await released;
        throw new Error('first import failed');
      }
      await repair(...args);
    });
    const importer = moduleRef.get(JsonProjectImportService);
    const validate = importer.validate.bind(importer);
    vi.spyOn(importer, 'validate').mockImplementation((payload) => {
      const validated = validate(payload);
      if (
        validated.entities['ProjectEntity']?.[0]?.['projectName'] ===
        'Second import'
      )
        gate.emit('second-staged');
      return validated;
    });
    const first = service.importProject('upload', firstArchive, projects);
    const firstRejected = expect(first).rejects.toMatchObject({ status: 500 });
    await firstEntered;
    const second = service.importProject('upload', secondArchive, projects);
    try {
      await secondStaged;
      expect(imports).toBe(1);
    } finally {
      gate.emit('release');
    }
    await firstRejected;
    await expect(second).resolves.toBe('existing');
    expect(
      (
        await database
          .getRepository(ProjectEntity)
          .findOneByOrFail({ projectSlug: 'existing' })
      ).projectName
    ).toBe('Second import');
    expect(
      readFileSync(join(projects, 'existing', 'recording.webm'), 'utf8')
    ).toBe('incoming media');
    expect(readdirSync(projects)).toEqual(['existing']);
  });

  it.each(['existing', 'second'])(
    'keeps overlapping exports complete when the second slug is %s',
    async (secondSlug) => {
      if (secondSlug !== 'existing') {
        mkdirSync(join(projects, secondSlug));
        writeFileSync(
          join(projects, secondSlug, 'recording.webm'),
          'second media'
        );
        await database
          .getRepository(ProjectEntity)
          .save({ projectSlug: secondSlug, projectName: 'Second' });
      }
      const io = moduleRef.get(ProjectIoService);
      const compress = io.compressProject.bind(io);
      const gate = new EventEmitter();
      const entered = once(gate, 'entered');
      const released = once(gate, 'release');
      let calls = 0;
      vi.spyOn(io, 'compressProject').mockImplementation(async (...args) => {
        calls++;
        if (calls === 2) {
          gate.emit('entered');
          await released;
        }
        await compress(...args);
      });
      const exporter = moduleRef.get(JsonProjectExportService);
      const exportRows = exporter.exportProject.bind(exporter);
      let exports = 0;
      vi.spyOn(exporter, 'exportProject').mockImplementation(async (slug) => ({
        ...(await exportRows(slug)),
        schemaHash: `export-${++exports}`
      }));
      const first = await service.exportProject('existing');
      const secondPending = service.exportProject(secondSlug);
      await entered;
      let firstZip: Record<string, Buffer>;
      try {
        firstZip = await readZip(first);
      } finally {
        gate.emit('release');
      }
      const secondZip = await readZip(await secondPending);
      expect(firstZip['recording.webm']?.toString()).toBe('original media');
      expect(secondZip['recording.webm']?.toString()).toBe(
        secondSlug === 'existing' ? 'original media' : 'second media'
      );
      expect(
        JSON.parse(firstZip['existing.fixture.json']?.toString() ?? 'null')
      ).toMatchObject({ projectSlug: 'existing', schemaHash: 'export-1' });
      expect(
        JSON.parse(
          secondZip[`${secondSlug}.fixture.json`]?.toString() ?? 'null'
        )
      ).toMatchObject({ projectSlug: secondSlug, schemaHash: 'export-2' });
      expect(readdirSync(projects).sort()).toEqual(
        secondSlug === 'existing' ? ['existing'] : ['existing', 'second']
      );
    }
  );
});
