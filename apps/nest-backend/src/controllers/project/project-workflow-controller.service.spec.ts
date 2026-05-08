import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { ProjectWorkFlowControllerService } from './project-workflow-controller.service';
import { SysConfigurationRepositoryService } from '../../core/repository/sys-configuration/sys-configuration-repository.service';
import { ProjectInitializationService } from '../../features/project-agent/project-initialization/project-initialization.service';
import { ConfigsService } from '../../core/configs/configs.service';

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    mkdirSync: vi.fn()
  };
});

describe('ProjectWorkFlowControllerService', () => {
  function build(opts?: {
    configurations?: Array<{ id: number; name: string; value: string }>;
    findAllError?: Error;
  }) {
    const configurations = opts?.configurations ?? [];
    const configurationService = {
      findAll: vi.fn(async () => {
        if (opts?.findAllError) throw opts.findAllError;
        return configurations;
      }),
      create: vi.fn(async (dto: unknown) => ({ id: 99, ...(dto as object) })),
      update: vi.fn(async (id: number, dto: unknown) => ({
        id,
        ...(dto as object)
      }))
    } as unknown as SysConfigurationRepositoryService;
    const projectInitializationService = {
      initProjectFileSystem: vi.fn(async () => 'init-result')
    } as unknown as ProjectInitializationService;
    const configsService = {
      getCONFIG_ROOT_PATH: () => 'rootProjectPath',
      getCONFIG_CURRENT_PROJECT_PATH: () => 'currentProjectPath'
    } as unknown as ConfigsService;
    return {
      svc: new ProjectWorkFlowControllerService(
        configurationService,
        projectInitializationService,
        configsService
      ),
      configurationService,
      projectInitializationService
    };
  }

  describe('setRootProjectFolder', () => {
    it('creates a config when none exist', async () => {
      const { svc, configurationService } = build({ configurations: [] });
      await svc.setRootProjectFolder('/tmp/projects');
      expect(configurationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'rootProjectPath',
          value: '/tmp/projects'
        })
      );
    });

    it('updates an existing root config', async () => {
      const { svc, configurationService } = build({
        configurations: [{ id: 5, name: 'rootProjectPath', value: '/old' }]
      });
      await svc.setRootProjectFolder('/new');
      expect(configurationService.update).toHaveBeenCalledWith(
        5,
        expect.objectContaining({ value: '/new' })
      );
    });
  });

  describe('initProject', () => {
    it('creates a current-project config and inits the file system when none exists', async () => {
      const { svc, configurationService, projectInitializationService } = build(
        {
          configurations: []
        }
      );
      await svc.initProject('p', { name: 'p' } as never);
      expect(configurationService.create).toHaveBeenCalled();
      expect(
        projectInitializationService.initProjectFileSystem
      ).toHaveBeenCalledWith('p', expect.any(Object));
    });

    it('updates the existing current-project config and re-inits the file system', async () => {
      const { svc, configurationService, projectInitializationService } = build(
        {
          configurations: [{ id: 9, name: 'currentProjectPath', value: 'old' }]
        }
      );
      await svc.initProject('p', { name: 'p' } as never);
      expect(configurationService.update).toHaveBeenCalledWith(
        9,
        expect.objectContaining({ value: 'p' })
      );
      expect(
        projectInitializationService.initProjectFileSystem
      ).toHaveBeenCalled();
    });

    it('wraps unexpected errors in a 500 HttpException', async () => {
      const { svc } = build({ findAllError: new Error('db down') });
      await expect(
        svc.initProject('p', { name: 'p' } as never)
      ).rejects.toBeInstanceOf(HttpException);
    });
  });

  describe('setProject', () => {
    it('creates a new current-project config when none with a different value exists', async () => {
      const { svc, configurationService } = build({ configurations: [] });
      await svc.setProject('p');
      expect(configurationService.create).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'p' })
      );
    });

    it('updates an existing current-project config that points elsewhere', async () => {
      const { svc, configurationService } = build({
        configurations: [{ id: 11, name: 'currentProjectPath', value: 'other' }]
      });
      await svc.setProject('p');
      expect(configurationService.update).toHaveBeenCalledWith(
        11,
        expect.objectContaining({ value: 'p' })
      );
    });
  });
});
