import { describe, expect, it, vi } from 'vitest';
import { SettingsController } from './settings.controller';

describe('SettingsController', () => {
  function build() {
    const projectRepositoryService = {
      getSettingBySlug: vi.fn().mockResolvedValue({ slug: 'proj-1' })
    };
    const projectFacadeRepositoryService = {
      updateProjectSettings: vi.fn().mockResolvedValue('p-updated'),
      updateApplicationSettings: vi.fn().mockResolvedValue('a-updated'),
      updateAuthenticationSettings: vi.fn().mockResolvedValue('au-updated'),
      updateBrowserSettings: vi.fn().mockResolvedValue('b-updated')
    };
    const controller = new SettingsController(
      projectRepositoryService as never,
      projectFacadeRepositoryService as never
    );
    return {
      controller,
      projectRepositoryService,
      projectFacadeRepositoryService
    };
  }

  it('getProjectSettings delegates to projectRepositoryService.getSettingBySlug', async () => {
    const { controller, projectRepositoryService } = build();
    const result = await controller.getProjectSettings('proj-1');
    expect(projectRepositoryService.getSettingBySlug).toHaveBeenCalledWith(
      'proj-1'
    );
    expect(result).toEqual({ slug: 'proj-1' });
  });

  it('updateProjectSettings forwards slug and partial settings to the facade', async () => {
    const { controller, projectFacadeRepositoryService } = build();
    const settings = { name: 'new' } as never;
    const result = await controller.updateProjectSettings('proj-1', settings);
    expect(
      projectFacadeRepositoryService.updateProjectSettings
    ).toHaveBeenCalledWith('proj-1', settings);
    expect(result).toBe('p-updated');
  });

  it('updateApplicationSettings forwards slug and partial settings to the facade', async () => {
    const { controller, projectFacadeRepositoryService } = build();
    const result = await controller.updateApplicationSettings('proj-1', {
      theme: 'dark'
    } as never);
    expect(
      projectFacadeRepositoryService.updateApplicationSettings
    ).toHaveBeenCalledWith('proj-1', { theme: 'dark' });
    expect(result).toBe('a-updated');
  });

  it('updateAuthenticationSettings forwards slug and partial settings to the facade', async () => {
    const { controller, projectFacadeRepositoryService } = build();
    const result = await controller.updateAuthenticationSettings('proj-1', {
      type: 'basic'
    } as never);
    expect(
      projectFacadeRepositoryService.updateAuthenticationSettings
    ).toHaveBeenCalledWith('proj-1', { type: 'basic' });
    expect(result).toBe('au-updated');
  });

  it.each([
    '',
    'example.com',
    '/relative',
    'ftp://example.com',
    'javascript:alert(1)',
    'https://'
  ])(
    'rejects a website URL that is not an absolute HTTP(S) URL: %j',
    async (websiteUrl) => {
      const { controller, projectFacadeRepositoryService } = build();
      await expect(
        controller.updateApplicationSettings('proj-1', { websiteUrl })
      ).rejects.toMatchObject({ status: 400 });
      expect(
        projectFacadeRepositoryService.updateApplicationSettings
      ).not.toHaveBeenCalled();
    }
  );

  it.each(['https://example.com/shop', 'http://localhost:4200/'])(
    'accepts and forwards the website URL %s',
    async (websiteUrl) => {
      const { controller, projectFacadeRepositoryService } = build();
      await controller.updateApplicationSettings('proj-1', { websiteUrl });
      expect(
        projectFacadeRepositoryService.updateApplicationSettings
      ).toHaveBeenCalledWith('proj-1', { websiteUrl });
    }
  );

  it('updateBrowserSettings forwards slug and partial settings to the facade', async () => {
    const { controller, projectFacadeRepositoryService } = build();
    const result = await controller.updateBrowserSettings('proj-1', {
      headless: true
    } as never);
    expect(
      projectFacadeRepositoryService.updateBrowserSettings
    ).toHaveBeenCalledWith('proj-1', { headless: true });
    expect(result).toBe('b-updated');
  });
});
