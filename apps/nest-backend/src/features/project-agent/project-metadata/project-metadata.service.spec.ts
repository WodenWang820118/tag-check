import { describe, expect, it, vi } from 'vitest';
import { ProjectMetadataService } from './project-metadata.service';

describe('ProjectMetadataService', () => {
  function build() {
    const projectService = {
      getProjectsMetadata: vi.fn().mockResolvedValue([{ slug: 'a' }]),
      getProjectMetadata: vi.fn().mockResolvedValue({ slug: 'a' })
    };
    return {
      projectService,
      service: new ProjectMetadataService(projectService as never)
    };
  }

  it('getProjectsMetadata delegates to ProjectService.getProjectsMetadata', async () => {
    const { service, projectService } = build();
    await expect(service.getProjectsMetadata()).resolves.toEqual([
      { slug: 'a' }
    ]);
    expect(projectService.getProjectsMetadata).toHaveBeenCalledOnce();
  });

  it('getProjectMetadata forwards the projectSlug to ProjectService', async () => {
    const { service, projectService } = build();
    await service.getProjectMetadata('demo');
    expect(projectService.getProjectMetadata).toHaveBeenCalledWith('demo');
  });
});
