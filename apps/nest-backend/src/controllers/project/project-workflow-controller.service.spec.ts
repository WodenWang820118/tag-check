import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { ProjectWorkFlowControllerService } from './project-workflow-controller.service';
import { ProjectInitializationService } from '../../features/project-agent/project-initialization/project-initialization.service';

describe('ProjectWorkFlowControllerService', () => {
  function build(initError?: Error) {
    const projectInitializationService = {
      initProjectFileSystem: vi.fn(async () => {
        if (initError) throw initError;
        return 'init-result';
      })
    } as unknown as ProjectInitializationService;
    return {
      svc: new ProjectWorkFlowControllerService(projectInitializationService),
      projectInitializationService
    };
  }

  describe('initProject', () => {
    it('inits the project and returns the result', async () => {
      const { svc, projectInitializationService } = build();
      await expect(svc.initProject('p', { name: 'p' } as never)).resolves.toBe(
        'init-result'
      );
      expect(
        projectInitializationService.initProjectFileSystem
      ).toHaveBeenCalledWith('p', expect.any(Object));
    });

    it('wraps unexpected errors in a 500 HttpException', async () => {
      const { svc } = build(new Error('db down'));
      await expect(
        svc.initProject('p', { name: 'p' } as never)
      ).rejects.toMatchObject({ status: 500, message: 'db down' });
      await expect(
        svc.initProject('p', { name: 'p' } as never)
      ).rejects.toBeInstanceOf(HttpException);
    });
  });
});
