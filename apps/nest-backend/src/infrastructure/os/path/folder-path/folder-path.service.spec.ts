import { describe, expect, it, vi } from 'vitest';
import { join } from 'path';
import { FolderPathService } from './folder-path.service';

describe('FolderPathService', () => {
  function build() {
    const pathUtilsService = {
      buildFolderPath: vi
        .fn()
        .mockImplementation(async (slug: string, folder: string) =>
          join('/root', slug, folder)
        )
    };
    const configurationService = {
      getRootProjectPath: vi.fn().mockResolvedValue('/root')
    };
    const configsService = {
      getRESULT_FOLDER: () => 'results',
      getRECORDING_FOLDER: () => 'recordings',
      getCONFIG_FOLDER: () => 'configs'
    };
    return {
      service: new FolderPathService(
        pathUtilsService as never,
        configurationService as never,
        configsService as never
      ),
      pathUtilsService,
      configurationService,
      configsService
    };
  }

  it('getRootProjectFolderPath delegates to the sys configuration repository', async () => {
    const { service, configurationService } = build();
    await expect(service.getRootProjectFolderPath()).resolves.toBe('/root');
    expect(configurationService.getRootProjectPath).toHaveBeenCalledOnce();
  });

  it('getReportSavingFolderPath uses the RESULT_FOLDER config', async () => {
    const { service, pathUtilsService } = build();
    const result = await service.getReportSavingFolderPath('demo');
    expect(pathUtilsService.buildFolderPath).toHaveBeenCalledWith(
      'demo',
      'results'
    );
    expect(result).toBe(join('/root', 'demo', 'results'));
  });

  it('getProjectFolderPath uses an empty folder name', async () => {
    const { service, pathUtilsService } = build();
    await service.getProjectFolderPath('demo');
    expect(pathUtilsService.buildFolderPath).toHaveBeenCalledWith('demo', '');
  });

  it('getRecordingFolderPath uses the RECORDING_FOLDER config', async () => {
    const { service, pathUtilsService } = build();
    await service.getRecordingFolderPath('demo');
    expect(pathUtilsService.buildFolderPath).toHaveBeenCalledWith(
      'demo',
      'recordings'
    );
  });

  it('getProjectConfigFolderPath uses the CONFIG_FOLDER config', async () => {
    const { service, pathUtilsService } = build();
    await service.getProjectConfigFolderPath('demo');
    expect(pathUtilsService.buildFolderPath).toHaveBeenCalledWith(
      'demo',
      'configs'
    );
  });

  it('getInspectionEventFolderPath joins RESULT_FOLDER + eventId', async () => {
    const { service, pathUtilsService } = build();
    await service.getInspectionEventFolderPath('demo', 'evt-1');
    expect(pathUtilsService.buildFolderPath).toHaveBeenCalledWith(
      'demo',
      join('results', 'evt-1')
    );
  });
});
