/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test } from '@nestjs/testing';
import { FolderPathService } from '../../infrastructure/os/path/folder-path/folder-path.service';
import { FolderService } from '../../infrastructure/os/folder/folder.service';
import { FilePathService } from '../../infrastructure/os/path/file-path/file-path.service';
import { FileService } from '../../infrastructure/os/file/file.service';
import { ProjectInitializationService } from './project-initialization.service';
import { join } from 'path';
import { ProjectInfoDto } from '../../dto/project-info.dto';
import { existsSync, rmdirSync } from 'fs';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { ConfigsService } from '../../core/configs/configs.service';

describe('ProjectInitializationService', () => {
  let service: ProjectInitializationService;
  let folderPathService: FolderPathService;
  let folderService: FolderService;
  let filePathService: FilePathService;
  let fileService: FileService;
  let configsService: ConfigsService;
  let rootProject: string;
  let initializedProject: string;
  let recordingFolder: string;
  let reportSavingFolder: string;
  let projectConfigFolder: string;
  let settings: ProjectInfoDto;
  let settingsFile: string;
  let metadataFile: string;
  let configFile: string;
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
    filePathService = moduleRef.get<FilePathService>(FilePathService);
    fileService = moduleRef.get<FileService>(FileService);
    configsService = moduleRef.get<ConfigsService>(ConfigsService);

    rootProject = join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '..',
      'tag_check_projects'
    );
    initializedProject = join(rootProject, 'newProject');
    recordingFolder = join(
      initializedProject,
      configsService.getRECORDING_FOLDER()
    );
    reportSavingFolder = join(
      initializedProject,
      configsService.getRESULT_FOLDER()
    );
    projectConfigFolder = join(
      initializedProject,
      configsService.getCONFIG_FOLDER()
    );
    settings = {
      version: '1.0.0',
      rootProject: rootProject,
      projectName: 'projectName',
      projectDescription: 'projectDescription',
      projectSlug: 'projectSlug',
      measurementId: 'measurementId',
      googleSpreadsheetLink: 'googleSpreadsheetLink'
    };
    settingsFile = join(initializedProject, configsService.getSETTINGS());
    metadataFile = join(initializedProject, configsService.getMETA_DATA());
    configFile = join(projectConfigFolder, configsService.getSPECS());
    eventFolder = join(reportSavingFolder, 'eventId');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize project', async () => {
    if (existsSync(initializedProject))
      rmdirSync(initializedProject, { recursive: true });
    const rootProjectPath = vi
      .spyOn(folderPathService, 'getRootProjectFolderPath')
      .mockResolvedValue(rootProject);
    const projectRoot = vi
      .spyOn(folderPathService, 'getProjectFolderPath')
      .mockResolvedValue(initializedProject);
    const createFolder = vi.spyOn(folderService, 'createFolder');
    const recordingFolderPath = vi
      .spyOn(folderPathService, 'getRecordingFolderPath')
      .mockResolvedValue(recordingFolder);
    const reportSavingFolderPath = vi
      .spyOn(folderPathService, 'getReportSavingFolderPath')
      .mockResolvedValue(reportSavingFolder);
    const projectConfigFolderPath = vi
      .spyOn(folderPathService, 'getProjectConfigFolderPath')
      .mockResolvedValue(projectConfigFolder);

    const settingsFilePath = vi
      .spyOn(filePathService, 'getProjectSettingFilePath')
      .mockResolvedValue(settingsFile);
    const metadataFilePath = vi
      .spyOn(filePathService, 'getProjectMetaDataFilePath')
      .mockResolvedValue(metadataFile);
    const configFilePath = vi
      .spyOn(filePathService, 'getProjectConfigFilePath')
      .mockResolvedValue(configFile);
    const writeJsonFile = vi.spyOn(fileService, 'writeJsonFile');

    await service.initProject('projectSlug', settings);

    expect(rootProjectPath).toHaveBeenCalled();
    expect(projectRoot).toHaveBeenCalled();
    expect(createFolder).toHaveBeenCalledTimes(4);
    expect(recordingFolderPath).toHaveBeenCalled();
    expect(reportSavingFolderPath).toHaveBeenCalled();
    expect(projectConfigFolderPath).toHaveBeenCalled();
    expect(settingsFilePath).toHaveBeenCalled();
    expect(metadataFilePath).toHaveBeenCalled();
    expect(configFilePath).toHaveBeenCalled();
    expect(writeJsonFile).toHaveBeenCalled();
  });

  it('should create event folder', async () => {
    if (existsSync(eventFolder)) rmdirSync(eventFolder, { recursive: true });
    const eventFolderPath = vi
      .spyOn(folderPathService, 'getInspectionEventFolderPath')
      .mockResolvedValue(eventFolder);
    const createFolder = vi.spyOn(folderService, 'createFolder');

    await service.initInspectionEventSavingFolder('newProject', 'eventId');

    expect(eventFolderPath).toHaveBeenCalled();
    expect(createFolder).toHaveBeenCalled();
  });
});
