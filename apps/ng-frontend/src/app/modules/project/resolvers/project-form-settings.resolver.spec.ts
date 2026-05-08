import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { SettingsService } from '../../../shared/services/api/settings/settings.service';
import { getProjectFormSettingsResolver } from './project-form-settings.resolver';

describe('getProjectFormSettingsResolver', () => {
  const settingsService = { getProjectSettings: vi.fn() };

  beforeEach(() => {
    TestBed.resetTestingModule();
    settingsService.getProjectSettings = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: SettingsService, useValue: settingsService }]
    });
  });

  function run(route: Partial<ActivatedRouteSnapshot>) {
    return TestBed.runInInjectionContext(() =>
      getProjectFormSettingsResolver(
        route as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot
      )
    );
  }

  it('returns null when no parent route is present', () => {
    expect(run({ parent: null })).toBeNull();
    expect(settingsService.getProjectSettings).not.toHaveBeenCalled();
  });

  it('looks up settings for the parent project slug', () => {
    const obs = of({} as any);
    settingsService.getProjectSettings.mockReturnValue(obs);

    const result = run({
      parent: { params: { projectSlug: 'demo' } } as any
    });

    expect(result).toBe(obs);
    expect(settingsService.getProjectSettings).toHaveBeenCalledWith('demo');
  });
});
