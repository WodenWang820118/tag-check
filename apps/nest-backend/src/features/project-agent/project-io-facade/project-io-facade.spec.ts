import { Test } from '@nestjs/testing';
import { ProjectIoFacadeService } from './project-io-facade.service';
import { join } from 'path';
import { StreamableFile } from '@nestjs/common';
import { FolderPathService } from '../../../infrastructure/os/path/folder-path/folder-path.service';
import { FolderService } from '../../../infrastructure/os/folder/folder.service';
import { ProjectIoService } from '../../../infrastructure/os/project-io/project-io.service';
import { createReadStream, mkdirSync } from 'fs';
import { describe, beforeEach, it, expect, vi } from 'vitest';

vi.mock('fs', () => ({
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(() => ({})),
  createReadStream: vi.fn(() => {
    return {
      on: vi.fn((event, cb) => {
        if (event === 'close') {
          cb();
        }
      })
    };
  })
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
      providers: [ProjectIoFacadeService]
    })
      .useMocker((token) => {
        if (token === FolderPathService) {
          return {
            getRootProjectFolderPath: vi.fn(() => rootProjectPath),
            getProjectFolderPath: vi.fn(() => projectPath)
          };
        }

        if (token === FolderService) {
          return {
            deleteFolder: vi.fn()
          };
        }

        if (token === ProjectIoService) {
          return {
            compressProject: vi.fn()
          };
        }

        if (typeof token === 'function') {
          return vi.fn();
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
    //   const result = await service.exportProject(projectSlug);
    //   expect(result).toBeInstanceOf(StreamableFile);
    //   expect(folderPathService.getRootProjectFolderPath).toHaveBeenCalled();
    //   expect(folderPathService.getProjectFolderPath).toHaveBeenCalledWith(
    //     projectSlug
    //   );
    //   expect(mkdirSync).toHaveBeenCalledWith(tempFolder, {
    //     recursive: true
    //   });
    //   expect(projectIoService.compressProject).toHaveBeenCalledWith(
    //     projectPath,
    //     zipPath
    //   );
    //   expect(createReadStream).toHaveBeenCalledWith(zipPath);
    //   expect(folderService.deleteFolder).toHaveBeenCalledWith(tempFolder);
  });
});
