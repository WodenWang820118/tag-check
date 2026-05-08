import { describe, expect, it, vi } from 'vitest';
import { ProjectWorkFlowController } from './project-workflow.controller';

describe('ProjectWorkFlowController', () => {
  function build() {
    const projectRepositoryService = {
      list: vi.fn().mockResolvedValue([{ slug: 'a' }])
    };
    const projectWorkFlowControllerService = {
      initProject: vi.fn().mockResolvedValue('initialized'),
      setProject: vi.fn().mockResolvedValue(undefined)
    };
    const exampleProjectRepositoryService = {
      ensureSeededOnce: vi.fn().mockResolvedValue(undefined)
    };
    const controller = new ProjectWorkFlowController(
      projectRepositoryService as never,
      projectWorkFlowControllerService as never,
      exampleProjectRepositoryService as never
    );
    return {
      controller,
      projectRepositoryService,
      projectWorkFlowControllerService,
      exampleProjectRepositoryService
    };
  }

  it('initProject delegates to ProjectWorkFlowControllerService.initProject with slug and settings', async () => {
    const { controller, projectWorkFlowControllerService } = build();
    const settings = { name: 'My Project' } as never;
    const result = await controller.initProject('proj-1', settings);
    expect(projectWorkFlowControllerService.initProject).toHaveBeenCalledWith(
      'proj-1',
      settings
    );
    expect(result).toBe('initialized');
  });

  it('setProject delegates to ProjectWorkFlowControllerService.setProject', async () => {
    const { controller, projectWorkFlowControllerService } = build();
    await controller.setProject('My Project');
    expect(projectWorkFlowControllerService.setProject).toHaveBeenCalledWith(
      'My Project'
    );
  });

  it('getProjects waits for example seeding before listing projects', async () => {
    const {
      controller,
      projectRepositoryService,
      exampleProjectRepositoryService
    } = build();
    const result = await controller.getProjects();
    expect(
      exampleProjectRepositoryService.ensureSeededOnce
    ).toHaveBeenCalledOnce();
    expect(projectRepositoryService.list).toHaveBeenCalledOnce();
    expect(result).toEqual([{ slug: 'a' }]);
    // Verify seeding was awaited before list ran
    const seedOrder =
      exampleProjectRepositoryService.ensureSeededOnce.mock
        .invocationCallOrder[0];
    const listOrder = projectRepositoryService.list.mock.invocationCallOrder[0];
    expect(seedOrder).toBeLessThan(listOrder);
  });
});
