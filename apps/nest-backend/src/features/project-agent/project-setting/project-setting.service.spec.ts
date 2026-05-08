import { describe, expect, it, vi } from 'vitest';
import { ProjectSettingService } from './project-setting.service';

function build(initialSettings: any = {}) {
  const fileService = {
    readJsonFile: vi.fn(() => initialSettings),
    writeJsonFile: vi.fn()
  };
  const filePathService = {
    getProjectSettingFilePath: vi.fn().mockResolvedValue('/cfg/settings.json')
  };
  const service = new ProjectSettingService(
    fileService as never,
    filePathService as never
  );
  return { service, fileService };
}

describe('ProjectSettingService', () => {
  it('getProjectSettings() returns slug + parsed settings file', async () => {
    const ctx = build({ headless: true });
    expect(await ctx.service.getProjectSettings('demo')).toEqual({
      projectSlug: 'demo',
      settings: { headless: true }
    });
  });

  it('updateSettings() reads, applies the update fn, then writes back the merged settings', async () => {
    const ctx = build({ headless: true });
    const result = await ctx.service.updateSettings('demo', (s: any) => ({
      ...s,
      foo: 'bar'
    }));
    expect(ctx.fileService.writeJsonFile).toHaveBeenCalledWith(
      '/cfg/settings.json',
      {
        headless: true,
        foo: 'bar'
      }
    );
    expect(result).toEqual({ headless: true, foo: 'bar' });
  });

  it('updateProjectSettings() routes the application section to updateApplicationSettings', async () => {
    const ctx = build({});
    const spy = vi
      .spyOn(ctx.service, 'updateApplicationSettings')
      .mockResolvedValue('ok' as never);
    await ctx.service.updateProjectSettings('demo', 'application', {
      localStorage: { data: [] },
      cookie: { data: [] }
    } as never);
    expect(spy).toHaveBeenCalled();
  });

  it('updateProjectSettings() returns undefined for unknown sections', async () => {
    const ctx = build({});
    const result = await ctx.service.updateProjectSettings(
      'demo',
      'unknown',
      {} as never
    );
    expect(result).toBeUndefined();
  });

  it('updateAuthenticationSettings() falls back to existing values when fields are missing', async () => {
    const ctx = build({
      authenticationSettings: { username: 'u', password: 'p' }
    });
    await ctx.service.updateAuthenticationSettings('demo', {
      username: 'new'
    } as never);
    expect(ctx.fileService.writeJsonFile).toHaveBeenCalledWith(
      '/cfg/settings.json',
      expect.objectContaining({
        authentication: { username: 'new', password: 'p' }
      })
    );
  });

  it('updateBrowserSettings() coerces headless to boolean and defaults browser to []', async () => {
    const ctx = build({});
    await ctx.service.updateBrowserSettings('demo', {} as never);
    expect(ctx.fileService.writeJsonFile).toHaveBeenCalledWith(
      '/cfg/settings.json',
      expect.objectContaining({ headless: false, browser: [] })
    );
  });

  it('updateApplicationSettings() safely parses JSON-shaped values inside localStorage and cookie data', async () => {
    const ctx = build({});
    await ctx.service.updateApplicationSettings('demo', {
      localStorage: {
        data: [
          { key: 'a', value: '{"x":1}' },
          { key: 'b', value: 'plain' }
        ]
      },
      cookie: { data: [{ key: 'c', value: '"raw"' }] }
    } as never);
    const written = ctx.fileService.writeJsonFile.mock.calls[0][1];
    expect(written.application.localStorage.data).toEqual([
      { key: 'a', value: { x: 1 } },
      { key: 'b', value: 'plain' }
    ]);
    expect(written.application.cookie.data).toEqual([
      { key: 'c', value: 'raw' }
    ]);
  });

  it('createProjectSettings() writes the settings to disk and echoes them back', async () => {
    const ctx = build({});
    const result = await ctx.service.createProjectSettings('demo', {
      headless: true
    } as never);
    expect(ctx.fileService.writeJsonFile).toHaveBeenCalledWith(
      '/cfg/settings.json',
      { headless: true }
    );
    expect(result).toEqual({ headless: true });
  });

  it('updateGtmSettings() and updateGeneralSettings() merge their input into the existing settings', async () => {
    const ctx = build({ a: 1 });
    await ctx.service.updateGtmSettings('demo', { gtm: 'x' } as never);
    expect(ctx.fileService.writeJsonFile).toHaveBeenLastCalledWith(
      '/cfg/settings.json',
      { a: 1, gtm: 'x' }
    );
    await ctx.service.updateGeneralSettings('demo', { other: 'y' } as never);
    expect(ctx.fileService.writeJsonFile).toHaveBeenLastCalledWith(
      '/cfg/settings.json',
      expect.objectContaining({ other: 'y' })
    );
  });
});
