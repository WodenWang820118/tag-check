 
import { Test } from '@nestjs/testing';
import { FolderPathService } from '../../../infrastructure/os/path/folder-path/folder-path.service';
import { FolderService } from '../../../infrastructure/os/folder/folder.service';
import { FilePathService } from '../../../infrastructure/os/path/file-path/file-path.service';
import { FileService } from '../../../infrastructure/os/file/file.service';
import { ProjectInitializationService } from './project-initialization.service';
import { join } from 'path';
import { existsSync, rmdirSync } from 'fs';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { ConfigsService } from '../../../core/configs/configs.service';

describe('ProjectInitializationService', () => {
  let service: ProjectInitializationService;
  let folderPathService: FolderPathService;
  let folderService: FolderService;
  let configsService: ConfigsService;
  let rootProject: string;
  let initializedProject: string;
  let reportSavingFolder: string;
  let eventFolder: string;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectInitializationService,
        FolderPathService,
        FolderService,
        FilePathService,
        FileService,
        ConfigsService
      ]
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
          return vi.fn();
        }
      })
      .compile();

    service = moduleRef.get<ProjectInitializationService>(
      ProjectInitializationService
    );
    folderPathService = moduleRef.get<FolderPathService>(FolderPathService);
    folderService = moduleRef.get<FolderService>(FolderService);
    configsService = moduleRef.get<ConfigsService>(ConfigsService);

    rootProject = join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '..',
      '..',
      'tag_check_projects'
    );
    initializedProject = join(rootProject, 'newProject');
    reportSavingFolder = join(
      initializedProject,
      configsService.getRESULT_FOLDER()
    );
    eventFolder = join(reportSavingFolder, 'eventId');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
