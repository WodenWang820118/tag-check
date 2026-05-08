import { HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ProjectIoController } from './project-io.controller';

describe('ProjectIoController', () => {
  function build(overrides: Record<string, unknown> = {}) {
    const projectIoFacadeService = {
      exportProject: vi.fn().mockResolvedValue('exported.zip'),
      importProject: vi.fn().mockResolvedValue('imported-slug'),
      deleteProject: vi.fn().mockResolvedValue(undefined),
      ...overrides
    };
    const configurationSerivce = {
      getRootProjectPath: vi.fn().mockResolvedValue('/projects')
    };
    const projectRepositoryService = {
      deleteBySlug: vi.fn().mockResolvedValue('db-deleted')
    };
    const controller = new ProjectIoController(
      projectIoFacadeService as never,
      configurationSerivce as never,
      projectRepositoryService as never
    );
    return {
      controller,
      projectIoFacadeService,
      configurationSerivce,
      projectRepositoryService
    };
  }

  function buildResponse() {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    return { status, json } as unknown as {
      status: ReturnType<typeof vi.fn>;
      json: ReturnType<typeof vi.fn>;
    };
  }

  it('exportProject delegates to ProjectIoFacadeService.exportProject', async () => {
    const { controller, projectIoFacadeService } = build();
    const result = await controller.exportProject('proj-1');
    expect(projectIoFacadeService.exportProject).toHaveBeenCalledWith('proj-1');
    expect(result).toBe('exported.zip');
  });

  it('importProject responds with 200 and the imported project slug', async () => {
    const { controller, projectIoFacadeService } = build();
    const response = buildResponse();
    const file = {
      originalname: 'my-project.zip',
      path: '/tmp/my-project.zip'
    } as never;
    await controller.importProject(file, response as never);
    expect(projectIoFacadeService.importProject).toHaveBeenCalledWith(
      'my-project',
      '/tmp/my-project.zip',
      '/projects'
    );
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      projectSlug: 'imported-slug'
    });
  });

  it('importProject wraps thrown errors as 400 HttpException', async () => {
    const { controller } = build({
      importProject: vi.fn().mockRejectedValue(new Error('bad zip'))
    });
    const response = buildResponse();
    const file = {
      originalname: 'my-project.zip',
      path: '/tmp/my-project.zip'
    } as never;
    await expect(
      controller.importProject(file, response as never)
    ).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST });
  });

  it('deleteProject deletes from disk and database, ignoring disk errors', async () => {
    const { controller, projectIoFacadeService, projectRepositoryService } =
      build({
        deleteProject: vi.fn().mockRejectedValue(new Error('disk error'))
      });
    const result = await controller.deleteProject('proj-1');
    expect(projectIoFacadeService.deleteProject).toHaveBeenCalledWith('proj-1');
    expect(projectRepositoryService.deleteBySlug).toHaveBeenCalledWith(
      'proj-1'
    );
    expect(result).toBe('db-deleted');
  });
});
