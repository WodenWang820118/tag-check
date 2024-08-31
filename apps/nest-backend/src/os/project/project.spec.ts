import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from './project.service';
import { FileService } from '../file/file.service';
import { FolderService } from '../folder/folder.service';
import { FolderPathService } from '../path/folder-path/folder-path.service';
import { FilePathService } from '../path/file-path/file-path.service';
import { Dirent } from 'fs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ProjectService', () => {
  let service: ProjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectService],
    })
      .useMocker((token) => {
        if (token === FileService) {
          return {
            readJsonFile: vi.fn().mockResolvedValue({ test: 'test' }),
          };
        }

        if (token === FolderService) {
          return {
            readFolderFiles: vi.fn().mockReturnValue([
              {
                name: 'test',
                parentPath: 'test',
                path: 'test',
                isFile: () => false,
                isDirectory: () => true,
                isBlockDevice: () => false,
                isCharacterDevice: () => false,
                isSymbolicLink: () => false,
                isFIFO: () => false,
                isSocket: () => false,
              } as Dirent,
            ]),
          };
        }

        if (token === FolderPathService) {
          return {
            getRootProjectFolderPath: vi.fn().mockResolvedValue('root'),
          };
        }

        if (token === FilePathService) {
          return {
            getProjectSettingFilePath: vi.fn().mockResolvedValue('settings'),
            getProjectMetaDataFilePath: vi.fn().mockResolvedValue('metadata'),
          };
        }

        if (typeof token === 'function') {
          return vi.fn();
        }
      })
      .compile();

    service = module.get<ProjectService>(ProjectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get project settings', async () => {
    const projectSlug = 'test';
    const mockSettings = { test: 'test' };
    expect(await service.getProjectSettings(projectSlug)).toEqual(mockSettings);
  });

  it('should get projects metadata', async () => {
    const mockProjectMetadata = [{ test: 'test' }];
    expect(await service.getProjectsMetadata()).toEqual(mockProjectMetadata);
  });

  it('should get project metadata', async () => {
    const projectSlug = 'test';
    const mockProjectMetadata = { test: 'test' };
    expect(await service.getProjectMetadata(projectSlug)).toEqual(
      mockProjectMetadata
    );
  });
});
