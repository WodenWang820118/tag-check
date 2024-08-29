import { Test } from '@nestjs/testing';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { PathUtilsService } from '../path-utils/path-utils.service';
import { join } from 'path';
import { FolderPathService } from './folder-path.service';
import {
  CONFIG_FOLDER,
  META_DATA,
  RECORDING_FOLDER,
  RESULT_FOLDER,
} from '../../../configs/project.config';
import { ConfigurationService } from '../../../configuration/configuration.service';
import { describe, beforeEach, expect, vi } from 'vitest';

const moduleMocker = new ModuleMocker(global);

describe('FolderPathService', () => {
  let service: FolderPathService;
  let rootProjectPath: string;

  beforeEach(async () => {
    rootProjectPath = join('..', '..', '..', '..', '..', 'tag_check_projects');

    const moduleRef = await Test.createTestingModule({
      providers: [FolderPathService],
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
          const mockMetadata = moduleMocker.getMetadata(
            token
          ) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    service = moduleRef.get<FolderPathService>(FolderPathService);
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
    expect(result).toBe(join(rootProjectPath, projectSlug, RESULT_FOLDER));
  });

  it('should get project folder path', async () => {
    const projectSlug = 'test-project';
    const result = await service.getProjectFolderPath(projectSlug);
    expect(result).toBe(join(rootProjectPath, projectSlug));
  });

  it('should get recording folder path', async () => {
    const projectSlug = 'test-project';
    const result = await service.getRecordingFolderPath(projectSlug);
    expect(result).toBe(join(rootProjectPath, projectSlug, RECORDING_FOLDER));
  });

  it('should get project config folder path', async () => {
    const projectSlug = 'test-project';
    const result = await service.getProjectConfigFolderPath(projectSlug);
    expect(result).toBe(join(rootProjectPath, projectSlug, CONFIG_FOLDER));
  });

  it('should get the inspection event folder path', async () => {
    const projectSlug = 'test-project';
    const eventId = 'test-event';
    const result = await service.getInspectionEventFolderPath(
      projectSlug,
      eventId
    );
    expect(result).toBe(
      join(rootProjectPath, projectSlug, RESULT_FOLDER, eventId)
    );
  });
});
