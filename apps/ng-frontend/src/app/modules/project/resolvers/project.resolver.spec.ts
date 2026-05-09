import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { ProjectService } from '../../../shared/services/api/project-info/project-info.service';
import { SettingsService } from '../../../shared/services/api/settings/settings.service';
import {
  projectInfoResolver,
  projectSettingResolver
} from './project.resolver';

describe('project.resolver', () => {
  const settingsService = { getProjectSettings: vi.fn() };
  const projectService = { getProjects: vi.fn() };

  beforeEach(() => {
    TestBed.resetTestingModule();
    settingsService.getProjectSettings = vi.fn();
    projectService.getProjects = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: SettingsService, useValue: settingsService },
        { provide: ProjectService, useValue: projectService }
      ]
    });
  });

  it('projectSettingResolver fetches by route slug', () => {
    const obs = of({} as any);
    settingsService.getProjectSettings.mockReturnValue(obs);

    const route = { params: { projectSlug: 'foo' } } as any;
    const result = TestBed.runInInjectionContext(() =>
      projectSettingResolver(route, {} as RouterStateSnapshot)
    );

    expect(result).toBe(obs);
    expect(settingsService.getProjectSettings).toHaveBeenCalledWith('foo');
  });

  it('projectInfoResolver lists all projects', () => {
    const obs = of([] as any);
    projectService.getProjects.mockReturnValue(obs);

    const result = TestBed.runInInjectionContext(() =>
      projectInfoResolver(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot
      )
    );

    expect(result).toBe(obs);
    expect(projectService.getProjects).toHaveBeenCalledTimes(1);
  });
});
