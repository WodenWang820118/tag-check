import { Test } from '@nestjs/testing';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { ProjectIoFacadeService } from './project-io-facade.service';
import { join } from 'path';
import { StreamableFile } from '@nestjs/common';
import { FolderPathService } from '../../os/path/folder-path/folder-path.service';
import { FolderService } from '../../os/folder/folder.service';
import { ProjectIoService } from '../../os/project-io/project-io.service';
import { createReadStream, existsSync, mkdirSync } from 'fs';

const moduleMocker = new ModuleMocker(global);
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(() => ({})),
  createReadStream: jest.fn(() => {
    return {
      on: jest.fn((event, cb) => {
        if (event === 'close') {
          cb();
        }
      }),
    };
  }),
}));

describe('ProjectIoFacadeService', () => {
  let service: ProjectIoFacadeService;
  let folderPathService: FolderPathService;
  let folderService: FolderService;
  let projectIoService: ProjectIoService;
  const rootProjectPath = join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    '..',
    'tag_check_projects'
  );
  const projectSlug = 'ng_gtm_integration_sample';
  const projectPath = join(rootProjectPath, projectSlug);
  const tempFolder = join(rootProjectPath, 'temp');
  const zipPath = join(tempFolder, `${projectSlug}.zip`);

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ProjectIoFacadeService],
    })
      .useMocker((token) => {
        if (token === FolderPathService) {
          return {
            getRootProjectFolderPath: jest.fn(() => rootProjectPath),
            getProjectFolderPath: jest.fn(() => projectPath),
          };
        }

        if (token === FolderService) {
          return {
            deleteFolder: jest.fn(),
          };
        }

        if (token === ProjectIoService) {
          return {
            compressProject: jest.fn(),
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

    service = moduleRef.get<ProjectIoFacadeService>(ProjectIoFacadeService);
    projectIoService = moduleRef.get<ProjectIoService>(ProjectIoService);
    folderPathService = moduleRef.get<FolderPathService>(FolderPathService);
    folderService = moduleRef.get<FolderService>(FolderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should export project successfully', async () => {
    // integration test
    const result = await service.exportProject(projectSlug);

    expect(result).toBeInstanceOf(StreamableFile);
    expect(folderPathService.getRootProjectFolderPath).toHaveBeenCalled();
    expect(folderPathService.getProjectFolderPath).toHaveBeenCalledWith(
      projectSlug
    );
    expect(existsSync).toHaveBeenCalledWith(projectPath);
    expect(mkdirSync).toHaveBeenCalledWith(tempFolder, {
      recursive: true,
    });
    expect(projectIoService.compressProject).toHaveBeenCalledWith(
      projectPath,
      zipPath
    );
    expect(createReadStream).toHaveBeenCalledWith(zipPath);
    expect(folderService.deleteFolder).toHaveBeenCalledWith(tempFolder);
  });
});
