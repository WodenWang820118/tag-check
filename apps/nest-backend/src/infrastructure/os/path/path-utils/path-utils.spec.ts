import { Test } from '@nestjs/testing';
import { PathUtilsService } from '../path-utils/path-utils.service';
import { ConfigurationService } from '../../../../core/configuration/configuration.service';
import { join } from 'path';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the entire fs module
vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true)
}));

describe('PathUtilsService', () => {
  let service: PathUtilsService;
  let configrationService: ConfigurationService;
  let rootProjectPath: string;

  beforeEach(async () => {
    rootProjectPath = join('..', '..', '..', '..', '..', 'tag_check_projects');

    const moduleRef = await Test.createTestingModule({
      providers: [PathUtilsService]
    })
      .useMocker((token) => {
        if (token === ConfigurationService) {
          return {
            getRootProjectPath: vi.fn().mockReturnValue(rootProjectPath)
          };
        }

        if (typeof token === 'function') {
          return vi.fn();
        }
      })
      .compile();

    service = moduleRef.get<PathUtilsService>(PathUtilsService);
    configrationService =
      moduleRef.get<ConfigurationService>(ConfigurationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should build file path', async () => {
    const projectName = 'projectName';
    const folderName = 'folderName';
    const fileName = 'fileName';
    const result = await service.buildFilePath(
      projectName,
      folderName,
      fileName
    );
    expect(configrationService.getRootProjectPath).toHaveBeenCalled();
    expect(result).toBe(
      join(rootProjectPath, projectName, folderName, fileName)
    );
  });

  it('should build folder path', async () => {
    const projectName = 'projectName';
    const folderName = 'folderName';
    const result = await service.buildFolderPath(projectName, folderName);
    expect(result).toBe(join(rootProjectPath, projectName, folderName));
  });
});
