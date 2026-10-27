import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProjectSetting } from '@utils';
import { SettingsService } from '../../../../shared/services/api/settings/settings.service';
import { RunHeadlessService } from './run-headless.service';

/** GET /settings/:projectSlug's JSON, reduced to what the service reads. */
function settingsJson(headless: boolean): ProjectSetting {
  return JSON.parse(
    JSON.stringify({
      projectSlug: 'demo',
      browserSettings: { headless, browser: [] }
    })
  ) as ProjectSetting;
}

describe('RunHeadlessService', () => {
  let getProjectSettings: ReturnType<typeof vi.fn>;

  function create(): RunHeadlessService {
    TestBed.configureTestingModule({
      providers: [
        { provide: SettingsService, useValue: { getProjectSettings } }
      ]
    });
    return TestBed.inject(RunHeadlessService);
  }

  beforeEach(() => {
    localStorage.clear();
    getProjectSettings = vi.fn(() => of(settingsJson(true)));
  });

  afterEach(() => localStorage.clear());

  it("defaults to the project's browser setting", () => {
    const service = create();

    service.load('demo');

    expect(getProjectSettings).toHaveBeenCalledWith('demo');
    expect(service.headless()).toBe(true);
    expect(service.headlessFor('demo')).toBe(true);
    expect(service.headlessFor('other')).toBeUndefined();
  });

  it("remembers the user's choice per project", () => {
    const service = create();
    service.load('demo');

    service.set(false);

    expect(localStorage.getItem('tag-check.run-headless.demo')).toBe('false');
    getProjectSettings.mockClear();
    service.load('other');
    expect(service.headless()).toBe(true);
    service.load('demo');
    expect(getProjectSettings).toHaveBeenCalledTimes(1);
    expect(service.headless()).toBe(false);
  });

  it('keeps a choice made while the settings were loading', () => {
    const settings = new Subject<ProjectSetting>();
    getProjectSettings.mockReturnValue(settings);
    const service = create();
    service.load('demo');

    service.set(false);
    settings.next(settingsJson(true));

    expect(service.headless()).toBe(false);
  });

  it('leaves the run option unset until the project setting arrives', () => {
    const settings = new Subject<ProjectSetting>();
    getProjectSettings.mockReturnValue(settings);
    const service = create();
    service.load('demo');
    expect(service.headlessFor('demo')).toBeUndefined();
    settings.next(settingsJson(true));
    expect(service.headlessFor('demo')).toBe(true);
  });

  it('does not reuse the previous default while reloading project settings', () => {
    const service = create();
    service.load('demo');
    getProjectSettings.mockReturnValue(new Subject<ProjectSetting>());
    service.load('demo');
    expect(service.headlessFor('demo')).toBeUndefined();
  });

  it('reads a stored choice when opening a test directly before loading the Tests page', () => {
    localStorage.setItem('tag-check.run-headless.demo', 'true');
    expect(create().headlessFor('demo')).toBe(true);
  });

  it('still applies a choice when storage is unavailable', () => {
    const service = create();
    service.load('demo');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    service.set(false);

    expect(service.headless()).toBe(false);
    vi.restoreAllMocks();
  });
});
