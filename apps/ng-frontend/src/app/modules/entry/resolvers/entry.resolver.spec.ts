import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Project } from '@utils';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectService } from '../../../shared/services/api/project-info/project-info.service';
import { MetadataSourceService } from '../../../shared/services/data-source/metadata-source.service';
import { entryMetadataResolver } from './entry.resolver';

describe('entryMetadataResolver', () => {
  const seededProject: Project = {
    projectName: 'Example Project',
    projectSlug: 'example-project'
  };

  let projectService: { getProjectsAfterStartupSeed: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    TestBed.resetTestingModule();

    projectService = {
      getProjectsAfterStartupSeed: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        MetadataSourceService,
        {
          provide: ProjectService,
          useValue: projectService
        }
      ]
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('stores resolved projects in the shared metadata source', async () => {
    projectService.getProjectsAfterStartupSeed.mockReturnValue(
      of([seededProject])
    );

    const resolvedProjects = firstValueFrom(resolveEntryMetadata());

    await expect(resolvedProjects).resolves.toEqual([seededProject]);
    await expect(
      firstValueFrom(TestBed.inject(MetadataSourceService).getData())
    ).resolves.toEqual([seededProject]);
    expect(projectService.getProjectsAfterStartupSeed).toHaveBeenCalledTimes(1);
  });

  it('resolves an empty list when project metadata loading fails', async () => {
    projectService.getProjectsAfterStartupSeed.mockReturnValue(
      throwError(() => new Error('Project list unavailable'))
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const resolvedProjects = firstValueFrom(resolveEntryMetadata());

    await expect(resolvedProjects).resolves.toEqual([]);
    expect(projectService.getProjectsAfterStartupSeed).toHaveBeenCalledTimes(1);
  });
});

function resolveEntryMetadata(): Observable<Project[]> {
  return TestBed.runInInjectionContext(
    () =>
      entryMetadataResolver(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot
      ) as Observable<Project[]>
  );
}
