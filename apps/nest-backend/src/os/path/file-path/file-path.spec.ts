import { Test } from '@nestjs/testing';
import { FilePathService } from './file-path.service';
import { PathUtilsService } from '../path-utils/path-utils.service';
import { ConfigurationService } from '../../../configuration/configuration.service';
import { FolderPathService } from '../folder-path/folder-path.service';
import { join } from 'path';
import {
  ABSTRACT_REPORT_FILE_NAME,
  CONFIG_FOLDER,
  META_DATA,
  RECORDING_FOLDER,
  RESULT_FOLDER,
} from '../../../configs/project.config';
import { describe, beforeEach, expect, vi } from 'vitest';

describe('FilePathService', () => {
  let service: FilePathService;
  let rootProjectPath: string;

  beforeEach(async () => {
    rootProjectPath = join('..', '..', '..', '..', '..', 'tag_check_projects');

    const moduleRef = await Test.createTestingModule({
      providers: [FilePathService],
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
                      CONFIG_FOLDER,
                      'spec.json'
                    )
                  );
                } else if (fileName === 'settings.json') {
                  return await Promise.resolve(
                    join(rootProjectPath, projectSlug, 'settings.json')
                  );
                } else if (fileName === META_DATA) {
                  return await Promise.resolve(
                    join(rootProjectPath, projectSlug, '', META_DATA)
                  );
                } else {
                  return await Promise.resolve(
                    join(
                      rootProjectPath,
                      projectSlug,
                      RECORDING_FOLDER,
                      fileName
                    )
                  );
                }
              }
            ),
            getRootProjectPath: vi.fn().mockReturnValue(rootProjectPath),
          };
        }

        if (token === ConfigurationService) {
          return {
            getRootProjectPath: vi.fn().mockReturnValue(rootProjectPath),
          };
        }

        if (token === FolderPathService) {
          return {
            getReportSavingFolderPath: vi.fn(async (projectSlug: string) => {
              return await Promise.resolve(
                join(rootProjectPath, projectSlug, RESULT_FOLDER)
              );
            }),
          };
        }

        if (typeof token === 'function') {
          return vi.fn();
        }
      })
      .compile();

    service = moduleRef.get<FilePathService>(FilePathService);
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
      join(rootProjectPath, 'ng_gtm_integration_sample', META_DATA)
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
        RESULT_FOLDER,
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
        RESULT_FOLDER,
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
        RESULT_FOLDER,
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
        RESULT_FOLDER,
        'add_payment_info_0afeb0fe-0905-4a78-9b81-d171b0fa48ff',
        ABSTRACT_REPORT_FILE_NAME
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
        RECORDING_FOLDER,
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
        RESULT_FOLDER,
        'add_payment_info_0afeb0fe-0905-4a78-9b81-d171b0fa48ff',
        'add_payment_info - myDataLayer.json'
      )
    );
  });
});
