import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { ProjectService } from '../../../shared/services/api/project-info/project-info.service';
import { gtmConfigResolver } from './gtm-config.resolver';

describe('gtmConfigResolver', () => {
  const projectService = { getProjectGtmConfig: vi.fn() };

  beforeEach(() => {
    TestBed.resetTestingModule();
    projectService.getProjectGtmConfig = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: ProjectService, useValue: projectService }]
    });
  });

  function run(route: Partial<ActivatedRouteSnapshot>) {
    return TestBed.runInInjectionContext(() =>
      gtmConfigResolver(
        route as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot
      )
    );
  }

  it('returns null when route has no parent', () => {
    expect(run({ parent: null })).toBeNull();
    expect(projectService.getProjectGtmConfig).not.toHaveBeenCalled();
  });

  it('delegates to the project service with the parent slug', () => {
    const observable = of({ containerId: 'GTM-XYZ' } as any);
    projectService.getProjectGtmConfig.mockReturnValue(observable);

    const result = run({
      parent: { params: { projectSlug: 'shop' } } as any
    });

    expect(result).toBe(observable);
    expect(projectService.getProjectGtmConfig).toHaveBeenCalledWith('shop');
  });
});
