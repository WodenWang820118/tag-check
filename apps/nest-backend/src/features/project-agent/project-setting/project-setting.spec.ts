import { Test } from '@nestjs/testing';
import { ProjectSettingService } from './project-setting.service';
import { FileService } from '../../../infrastructure/os/file/file.service';
import { FilePathService } from '../../../infrastructure/os/path/file-path/file-path.service';
import { Setting } from '@utils';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('ProjectSettingService', () => {
  let service: ProjectSettingService;
  let fileService: FileService;
  let filePathService: FilePathService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ProjectSettingService]
    })
      .useMocker((token) => {
        if (token === FileService) {
          return {
            readJsonFile: vi.fn(),
            writeJsonFile: vi.fn()
          };
        }

        if (token === FilePathService) {
          return {
            getProjectSettingFilePath: vi.fn()
          };
        }

        if (typeof token === 'function') {
          return vi.fn();
        }
      })
      .compile();

    service = moduleRef.get<ProjectSettingService>(ProjectSettingService);
    fileService = moduleRef.get<FileService>(FileService);
    filePathService = moduleRef.get<FilePathService>(FilePathService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get project settings', async () => {
    const projectSlug = 'projectSlug';
    const content = { key: 'value' };
    const readJsonFileSpy = vi
      .spyOn(fileService, 'readJsonFile')
      .mockReturnValue(content);
    const getProjectSettingFilePathSpy = vi
      .spyOn(filePathService, 'getProjectSettingFilePath')
      .mockResolvedValue('filePath');

    const result = await service.getProjectSettings(projectSlug);

    expect(getProjectSettingFilePathSpy).toHaveBeenCalledWith(projectSlug);
    expect(readJsonFileSpy).toHaveBeenCalledWith('filePath');
    expect(result).toEqual({
      projectSlug,
      settings: content
    });
  });

  it('should update project settings', async () => {
    const projectSlug = 'projectSlug';
    const partialSettings = { key: 'value' };
    const updateFn = vi.fn().mockReturnValue(partialSettings);
    const filePath = 'filePath';
    const readJsonFileSpy = vi
      .spyOn(fileService, 'readJsonFile')
      .mockReturnValue(partialSettings);
    const getProjectSettingFilePathSpy = vi
      .spyOn(filePathService, 'getProjectSettingFilePath')
      .mockResolvedValue(filePath);
    const writeJsonFileSpy = vi.spyOn(fileService, 'writeJsonFile');

    const result = await service.updateSettings(projectSlug, updateFn);

    expect(getProjectSettingFilePathSpy).toHaveBeenCalledWith(projectSlug);
    expect(readJsonFileSpy).toHaveBeenCalledWith(filePath);
    expect(writeJsonFileSpy).toHaveBeenCalledWith(filePath, partialSettings);
    expect(result).toEqual(partialSettings);
  });

  describe('updateProjectSettings', () => {
    const projectSlug = 'test-project';

    it('should call updateApplicationSettings for application section', async () => {
      const spy = vi.spyOn(service, 'updateApplicationSettings');
      const partialSettings: Partial<Setting> = {
        application: {
          localStorage: {
            data: [
              {
                key: 'consentPreferences',
                value: JSON.stringify({
                  ad_storage: true,
                  analytics_storage: true,
                  ad_user_data: true,
                  ad_personalization: false
                })
              },
              {
                key: 'consent',
                value: JSON.stringify(true)
              }
            ]
          },
          cookie: { data: [{ key: 'key', value: JSON.stringify('value') }] }
        }
      };

      await service.updateProjectSettings(
        projectSlug,
        'application',
        partialSettings
      );

      expect(spy).toHaveBeenCalledWith(projectSlug, partialSettings);
    });

    it('should call updateBrowserSettings for browser section', async () => {
      const spy = vi.spyOn(service, 'updateBrowserSettings');
      const partialSettings: Partial<Setting> = {
        browser: [
          '--window-size=1440,900',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--incognito'
        ]
      };

      await service.updateProjectSettings(
        projectSlug,
        'browser',
        partialSettings
      );

      expect(spy).toHaveBeenCalledWith(projectSlug, partialSettings);
    });

    it('should call updateGtmSettings for gtm section', async () => {
      const spy = vi.spyOn(service, 'updateGtmSettings');
      const partialSettings: Partial<Setting> = {
        gtm: {
          isAccompanyMode: true,
          isRequestCheck: true,
          tagManagerUrl:
            'https://tagmanager.google.com/?utm_source=marketingplatform.google.com&utm_medium=et&utm_campaign=marketingplatform.google.com%2Fabout%2Ftag-manager%2F#/container/accounts/6140708819/containers/168785492/workspaces/28',
          gtmPreviewModeUrl:
            'https://tagassistant.google.com/#/?id=GTM-NBMX2DWS&url=https%3A%2F%2Fgtm-integration-sample.netlify.app%2F&source=TAG_MANAGER&gtm_auth=dWGYVg8mXuHHNyA2tt55zg&gtm_preview=env-3'
        }
      };

      await service.updateProjectSettings(projectSlug, 'gtm', partialSettings);

      expect(spy).toHaveBeenCalledWith(projectSlug, partialSettings);
    });

    it('should call updatePreventNavigationEvents for preventNavigationEvents section', async () => {
      const spy = vi
        .spyOn(service, 'updateSettings')
        .mockImplementation(
          async (
            projectSlug: string,
            updateFn: (currentSetting: Setting) => Setting
          ) => {
            const currentSettings = {
              preventNavigationEvents: ['event1', 'event2', 'event3']
            } as Setting;
            return updateFn(currentSettings);
          }
        );

      const partialSettings = { preventNavigationEvents: ['event2'] };
      const result = await service.updatePreventNavigationEvents(
        projectSlug,
        partialSettings
      );

      expect(result.preventNavigationEvents).toEqual(['event1', 'event3']);
      expect(spy).toHaveBeenCalled();
    });

    it('should call updateAuthenticationSettings for authentication section', async () => {
      const spy = vi.spyOn(service, 'updateAuthenticationSettings');
      const partialSettings = {
        authentication: { username: 'user', password: 'pass' }
      };

      await service.updateProjectSettings(
        projectSlug,
        'authentication',
        partialSettings
      );

      expect(spy).toHaveBeenCalledWith(projectSlug, partialSettings);
    });

    it('should call updateGeneralSettings for others section', async () => {
      const spy = vi.spyOn(service, 'updateGeneralSettings');
      const partialSettings: Partial<Setting> = { headless: true };

      await service.updateProjectSettings(
        projectSlug,
        'others',
        partialSettings
      );

      expect(spy).toHaveBeenCalledWith(projectSlug, partialSettings);
    });

    it('should return undefined for unknown section', async () => {
      const result = await service.updateProjectSettings(
        projectSlug,
        'unknown',
        {}
      );

      expect(result).toBeUndefined();
    });
  });

  it('should create project settings', async () => {
    const projectSlug = 'new-project';
    const settings = { key: 'value' } as any;
    const filePath = 'filePath';
    const getProjectSettingFilePathSpy = vi
      .spyOn(filePathService, 'getProjectSettingFilePath')
      .mockResolvedValue(filePath);
    const writeJsonFileSpy = vi.spyOn(fileService, 'writeJsonFile');

    const result = await service.createProjectSettings(projectSlug, settings);

    expect(result).toEqual(settings);
    expect(getProjectSettingFilePathSpy).toHaveBeenCalledWith(projectSlug);
    expect(writeJsonFileSpy).toHaveBeenCalledWith(filePath, settings);
  });
});
