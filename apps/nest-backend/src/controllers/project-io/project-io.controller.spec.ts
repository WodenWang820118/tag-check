import { HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ProjectIoController } from './project-io.controller';

// Prevent actual filesystem operations in unit tests
vi.mock('node:stream/promises', () => ({
  pipeline: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('node:fs', () => ({
  createWriteStream: vi.fn().mockReturnValue({})
}));
vi.mock('node:fs/promises', () => ({
  unlink: vi.fn().mockResolvedValue(undefined)
}));

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

  function buildRequest(filename = 'my-project.zip') {
    const file = vi.fn().mockResolvedValue({ filename, file: {} });
    return { file };
  }

  function buildReply() {
    const send = vi.fn();
    const code = vi.fn().mockReturnValue({ send });
    return { code, send };
  }

  it('exportProject delegates to ProjectIoFacadeService.exportProject', async () => {
    const { controller, projectIoFacadeService } = build();
    const result = await controller.exportProject('proj-1');
    expect(projectIoFacadeService.exportProject).toHaveBeenCalledWith('proj-1');
    expect(result).toBe('exported.zip');
  });

  it('importProject responds with 200 and the imported project slug', async () => {
    const { controller, projectIoFacadeService } = build();
    const request = buildRequest('my-project.zip');
    const { code, send } = buildReply();
    await controller.importProject(request as never, { code } as never);
    expect(projectIoFacadeService.importProject).toHaveBeenCalledWith(
      'my-project',
      expect.stringContaining('my-project.zip'),
      '/projects'
    );
    expect(code).toHaveBeenCalledWith(200);
    expect(send).toHaveBeenCalledWith({ projectSlug: 'imported-slug' });
  });

  it('importProject sanitizes path-traversal filenames via basename', async () => {
    const { controller, projectIoFacadeService } = build();
    // Attacker sends '../etc/shadow.zip' — basename() should strip the directory
    const request = buildRequest('../etc/shadow.zip');
    const { code, send } = buildReply();
    await controller.importProject(request as never, { code } as never);
    // The slug and path must NOT contain '..' components
    const [[slug, filePath]] = projectIoFacadeService.importProject.mock
      .calls as [string, string, string][];
    expect(slug).toBe('shadow');
    expect(filePath).not.toContain('..');
    expect(code).toHaveBeenCalledWith(200);
    expect(send).toHaveBeenCalledWith({ projectSlug: 'imported-slug' });
  });

  it('importProject wraps thrown errors as 400 HttpException', async () => {
    const { controller } = build({
      importProject: vi.fn().mockRejectedValue(new Error('bad zip'))
    });
    const request = buildRequest('my-project.zip');
    const { code } = buildReply();
    await expect(
      controller.importProject(request as never, { code } as never)
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
