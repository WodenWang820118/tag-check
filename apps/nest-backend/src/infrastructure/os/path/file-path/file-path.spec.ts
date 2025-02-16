import { Test } from '@nestjs/testing';
import { FilePathService } from './file-path.service';
import { PathUtilsService } from '../path-utils/path-utils.service';
import { FolderPathService } from '../folder-path/folder-path.service';
import { join } from 'path';
import { describe, beforeEach, expect, vi } from 'vitest';
import { ConfigsService } from '../../../../core/configs/configs.service';
import { SysConfigurationRepositoryService } from '../../../../core/repository/sys-configuration/sys-configuration-repository.service';

// Mock the entire fs module
vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true)
}));

describe('FilePathService', () => {
  let service: FilePathService;
  let configsService: ConfigsService;
  let rootProjectPath: string;

  beforeEach(async () => {
    rootProjectPath = join('..', '..', '..', '..', '..', 'tag_check_projects');

    const moduleRef = await Test.createTestingModule({
      providers: [FilePathService, ConfigsService]
    })
      .useMocker((token) => {
        if (token === PathUtilsService) {
          return {
            buildFilePath: vi.fn(
              async (
                projectSlug: string,
                folderName: string,
                fileName?: string
              ) => {
                if (fileName === 'spec.json') {
                  return await Promise.resolve(
                    join(
                      rootProjectPath,
                      projectSlug,
                      configsService.getCONFIG_FOLDER(),
                      'spec.json'
                    )
                  );
                } else if (fileName === 'settings.json') {
                  return await Promise.resolve(
                    join(rootProjectPath, projectSlug, 'settings.json')
                  );
                } else if (fileName === configsService.getMETA_DATA()) {
                  return await Promise.resolve(
                    join(
                      rootProjectPath,
                      projectSlug,
                      '',
                      configsService.getMETA_DATA()
                    )
                  );
                } else {
                  return await Promise.resolve(
                    join(
                      rootProjectPath,
                      projectSlug,
                      configsService.getRECORDING_FOLDER(),
                      fileName
                    )
                  );
                }
              }
            ),
            getRootProjectPath: vi.fn().mockReturnValue(rootProjectPath)
          };
        }

        if (token === SysConfigurationRepositoryService) {
          return {
            getRootProjectPath: vi.fn().mockReturnValue(rootProjectPath)
          };
        }

        if (token === FolderPathService) {
          return {
            getReportSavingFolderPath: vi.fn(async (projectSlug: string) => {
              return await Promise.resolve(
                join(
                  rootProjectPath,
                  projectSlug,
                  configsService.getRESULT_FOLDER()
                )
              );
            })
          };
        }

        if (typeof token === 'function') {
          return vi.fn();
        }
      })
      .compile();

    service = moduleRef.get<FilePathService>(FilePathService);
    configsService = moduleRef.get<ConfigsService>(ConfigsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return the correct file path', async () => {
    const actualPath = await service.getOperationFilePath(
      'ng_gtm_integration_sample',
      'add_payment_info_0afeb0fe-0905-4a78-9b81-d171b0fa48ff'
    );
    expect(actualPath).toBe(
      join(
        rootProjectPath,
        'ng_gtm_integration_sample',
        'chrome_recordings',
        'add_payment_info_0afeb0fe-0905-4a78-9b81-d171b0fa48ff.json'
      )
    );
  });

  it('should return the correct config file path', async () => {
    const actualPath = await service.getProjectConfigFilePath(
      'ng_gtm_integration_sample'
    );
    expect(actualPath).toBe(
      join(rootProjectPath, 'ng_gtm_integration_sample', 'config', 'spec.json')
    );
  });

  it('should return the correct setting file path', async () => {
    const actualPath = await service.getProjectSettingFilePath(
      'ng_gtm_integration_sample'
    );
    expect(actualPath).toBe(
      join(rootProjectPath, 'ng_gtm_integration_sample', 'settings.json')
    );
  });

  it('should return the correct project meta data file path', async () => {
    const actualPath = await service.getProjectMetaDataFilePath(
      'ng_gtm_integration_sample'
    );
    expect(actualPath).toBe(
      join(
        rootProjectPath,
        'ng_gtm_integration_sample',
        configsService.getMETA_DATA()
      )
    );
  });

  it('should return the correct report file path', async () => {
    const actualPath = await service.getReportFilePath(
      'ng_gtm_integration_sample',
      'add_payment_info_0afeb0fe-0905-4a78-9b81-d171b0fa48ff',
      'QA_report_single_add_payment_info_0afeb0fe-0905-4a78-9b81-d171b0fa48ff_2024-07-15_114529.xlsx'
    );
    expect(actualPath).toBe(
      join(
        rootProjectPath,
        'ng_gtm_integration_sample',
        configsService.getRESULT_FOLDER(),
        'add_payment_info_0afeb0fe-0905-4a78-9b81-d171b0fa48ff',
        'QA_report_single_add_payment_info_0afeb0fe-0905-4a78-9b81-d171b0fa48ff_2024-07-15_114529.xlsx'
      )
    );
  });

  it('should return the correct cache file path', async () => {
    const actualPath = await service.getCacheFilePath(
      'ng_gtm_integration_sample',
      'add_payment_info_0afeb0fe-0905-4a78-9b81-d171b0fa48ff'
    );
    expect(actualPath).toBe(
      join(
        rootProjectPath,
        'ng_gtm_integration_sample',
        configsService.getRESULT_FOLDER(),
        'add_payment_info_0afeb0fe-0905-4a78-9b81-d171b0fa48ff',
        'add_payment_info - result cache.json'
      )
    );
  });

  it('should retrun the correct image file path', async () => {
    const actualPath = await service.getImageFilePath(
      'ng_gtm_integration_sample',
      'add_payment_info_0afeb0fe-0905-4a78-9b81-d171b0fa48ff'
    );
    expect(actualPath).toBe(
      join(
        rootProjectPath,
        'ng_gtm_integration_sample',
        configsService.getRESULT_FOLDER(),
        'add_payment_info_0afeb0fe-0905-4a78-9b81-d171b0fa48ff',
        'add_payment_info.png'
      )
    );
  });

  it('should return the correct inspection result file path', async () => {
    const actualPath = await service.getInspectionResultFilePath(
      'ng_gtm_integration_sample',
      'add_payment_info_0afeb0fe-0905-4a78-9b81-d171b0fa48ff'
    );
    expect(actualPath).toBe(
      join(
        rootProjectPath,
        'ng_gtm_integration_sample',
        configsService.getRESULT_FOLDER(),
        'add_payment_info_0afeb0fe-0905-4a78-9b81-d171b0fa48ff',
        configsService.getABSTRACT_REPORT_FILE_NAME()
      )
    );
  });

  it('should get the correct recording file path', async () => {
    const actualPath = await service.getRecordingFilePath(
      'ng_gtm_integration_sample',
      'add_payment_info_0afeb0fe-0905-4a78-9b81-d171b0fa48ff'
    );
    expect(actualPath).toBe(
      join(
        rootProjectPath,
        'ng_gtm_integration_sample',
        configsService.getRECORDING_FOLDER(),
        'add_payment_info_0afeb0fe-0905-4a78-9b81-d171b0fa48ff'
      )
    );
  });

  it('should get the correct my datalayer file path', async () => {
    const actualPath = await service.getMyDataLayerFilePath(
      'ng_gtm_integration_sample',
      'add_payment_info_0afeb0fe-0905-4a78-9b81-d171b0fa48ff'
    );
    expect(actualPath).toBe(
      join(
        rootProjectPath,
        'ng_gtm_integration_sample',
        configsService.getRESULT_FOLDER(),
        'add_payment_info_0afeb0fe-0905-4a78-9b81-d171b0fa48ff',
        'add_payment_info - myDataLayer.json'
      )
    );
  });
});
