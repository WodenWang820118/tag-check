import { Test } from '@nestjs/testing';
import { PathUtilsService } from '../path-utils/path-utils.service';
import { join } from 'path';
import { FolderPathService } from './folder-path.service';
import { ConfigurationService } from '../../../configuration/configuration.service';
import { describe, beforeEach, expect, vi } from 'vitest';
import { ConfigsService } from '../../../configs/configs.service';

describe('FolderPathService', () => {
  let service: FolderPathService;
  let configsService: ConfigsService;
  let rootProjectPath: string;

  beforeEach(async () => {
    rootProjectPath = join('..', '..', '..', '..', '..', 'tag_check_projects');

    const moduleRef = await Test.createTestingModule({
      providers: [FolderPathService, ConfigsService],
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
            getRootProjectFolderPath: vi.fn().mockReturnValue(rootProjectPath),
            buildFolderPath: vi.fn(
              async (projectSlug: string, folderName: string) => {
                return await Promise.resolve(
                  join(rootProjectPath, projectSlug, folderName)
                );
              }
            ),
          };
        }

        if (token === ConfigurationService) {
          return {
            getRootProjectPath: vi.fn().mockReturnValue(rootProjectPath),
          };
        }

        if (typeof token === 'function') {
          return vi.fn();
        }
      })
      .compile();

    service = moduleRef.get<FolderPathService>(FolderPathService);
    configsService = moduleRef.get<ConfigsService>(ConfigsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get root project folder path', async () => {
    const result = await service.getRootProjectFolderPath();
    expect(result).toBe(rootProjectPath);
  });

  it('should get report saving folder path', async () => {
    const projectSlug = 'test-project';
    const result = await service.getReportSavingFolderPath(projectSlug);
    expect(result).toBe(
      join(rootProjectPath, projectSlug, configsService.getRESULT_FOLDER())
    );
  });

  it('should get project folder path', async () => {
    const projectSlug = 'test-project';
    const result = await service.getProjectFolderPath(projectSlug);
    expect(result).toBe(join(rootProjectPath, projectSlug));
  });

  it('should get recording folder path', async () => {
    const projectSlug = 'test-project';
    const result = await service.getRecordingFolderPath(projectSlug);
    expect(result).toBe(
      join(rootProjectPath, projectSlug, configsService.getRECORDING_FOLDER())
    );
  });

  it('should get project config folder path', async () => {
    const projectSlug = 'test-project';
    const result = await service.getProjectConfigFolderPath(projectSlug);
    expect(result).toBe(
      join(rootProjectPath, projectSlug, configsService.getCONFIG_FOLDER())
    );
  });

  it('should get the inspection event folder path', async () => {
    const projectSlug = 'test-project';
    const eventId = 'test-event';
    const result = await service.getInspectionEventFolderPath(
      projectSlug,
      eventId
    );
    expect(result).toBe(
      join(
        rootProjectPath,
        projectSlug,
        configsService.getRESULT_FOLDER(),
        eventId
      )
    );
  });
});
