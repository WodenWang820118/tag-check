import { Test, type TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Readable } from 'node:stream';
import { EventEmitter, once } from 'node:events';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { DATABASE_ENTITIES } from '../../core/database/database-entities';
import { ProjectEntity } from '../../shared';
import { ProjectRepositoryService } from '../../core/repository/project/project-repository.service';
import { SysConfigurationRepositoryService } from '../../core/repository/sys-configuration/sys-configuration-repository.service';
import { ProjectIoFacadeService } from '../../features/project-agent/project-io-facade/project-io-facade.service';
import { ProjectIoController } from './project-io.controller';

describe('ProjectIoController file safety', () => {
  let root: string;
  let moduleRef: TestingModule;
  let controller: ProjectIoController;
  let database: DataSource;
  const importProject =
    vi.fn<(slug: string, path: string, output: string) => Promise<string>>();
  const deleteProject = vi.fn<(slug: string) => Promise<void>>();

  beforeEach(async () => {
    root = mkdtempSync(join(process.cwd(), '.project-upload-safety-'));
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: DATABASE_ENTITIES,
          synchronize: true,
          dropSchema: true
        }),
        TypeOrmModule.forFeature([ProjectEntity])
      ],
      controllers: [ProjectIoController],
      providers: [
        ProjectRepositoryService,
        {
          provide: ProjectIoFacadeService,
          useValue: { importProject, deleteProject }
        },
        {
          provide: SysConfigurationRepositoryService,
          useValue: { getRootProjectPath: async () => root }
        }
      ]
    }).compile();
    controller = moduleRef.get(ProjectIoController);
    database = moduleRef.get(DataSource);
  });

  afterEach(async () => {
    importProject.mockReset();
    deleteProject.mockReset();
    await moduleRef?.close();
    rmSync(root, { recursive: true, force: true });
  });

  function upload(bytes: string) {
    return {
      file: async () => ({
        filename: 'project.zip',
        file: Readable.from([Buffer.from(bytes)])
      })
    } as unknown as FastifyRequest;
  }

  function reply() {
    const send = vi.fn();
    const code = vi.fn().mockReturnValue({ send });
    return { code, send };
  }

  it('lets overlapping uploads named project.zip read their own bytes after the other request cleans up', async () => {
    const gate = new EventEmitter();
    const firstEntered = once(gate, 'entered');
    const released = once(gate, 'release');
    const seen: string[] = [];
    const paths: string[] = [];
    importProject.mockImplementation(async (_slug, path) => {
      paths.push(path);
      if (paths.length === 1) {
        gate.emit('entered');
        await released;
      }
      seen.push(readFileSync(path, 'utf8'));
      return 'imported';
    });
    const firstReply = reply();
    const secondReply = reply();
    const first = controller.importProject(
      upload('first archive'),
      firstReply as unknown as FastifyReply
    );
    await firstEntered;
    try {
      await controller.importProject(
        upload('second archive'),
        secondReply as unknown as FastifyReply
      );
    } finally {
      gate.emit('release');
    }
    await first;
    expect(seen).toEqual(['second archive', 'first archive']);
    expect(new Set(paths).size).toBe(2);
    expect(firstReply.code).toHaveBeenCalledWith(200);
    expect(secondReply.code).toHaveBeenCalledWith(200);
    expect(readdirSync(root)).toEqual([]);
  });

  it('cleans up only the failed upload directory', async () => {
    writeFileSync(join(root, 'keep.txt'), 'keep');
    importProject.mockRejectedValue(new Error('bad archive'));
    const response = reply();
    await expect(
      controller.importProject(
        upload('bad archive'),
        response as unknown as FastifyReply
      )
    ).rejects.toMatchObject({ status: 400 });
    expect(response.send).not.toHaveBeenCalled();
    expect(readdirSync(root)).toEqual(['keep.txt']);
  });

  it('fails deletion before deleting rows when folder removal throws', async () => {
    await database
      .getRepository(ProjectEntity)
      .save({ projectSlug: 'existing', projectName: 'Original' });
    mkdirSync(join(root, 'existing'));
    writeFileSync(join(root, 'existing', 'recording.webm'), 'media');
    const rows = await database.getRepository(ProjectEntity).find();
    deleteProject.mockRejectedValue(new Error('EPERM: cannot remove folder'));
    await expect(controller.deleteProject('existing')).rejects.toThrow('EPERM');
    expect(await database.getRepository(ProjectEntity).find()).toEqual(rows);
    expect(readFileSync(join(root, 'existing', 'recording.webm'), 'utf8')).toBe(
      'media'
    );
  });
});
