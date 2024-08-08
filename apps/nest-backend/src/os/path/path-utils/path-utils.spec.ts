import { Test } from '@nestjs/testing';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { PathUtilsService } from '../path-utils/path-utils.service';
import { ConfigurationService } from '../../../configuration/configuration.service';
import { join } from 'path';

const moduleMocker = new ModuleMocker(global);

describe('PathUtilsService', () => {
  let service: PathUtilsService;
  let configrationService: ConfigurationService;
  let rootProjectPath: string;

  beforeEach(async () => {
    rootProjectPath = join('..', '..', '..', '..', '..', 'tag_check_projects');

    const moduleRef = await Test.createTestingModule({
      providers: [PathUtilsService],
    })
      .useMocker((token) => {
        if (token === ConfigurationService) {
          return {
            getRootProjectPath: jest.fn().mockReturnValue(rootProjectPath),
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
