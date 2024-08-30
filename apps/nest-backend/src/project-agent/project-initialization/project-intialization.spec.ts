import { Test } from '@nestjs/testing';
import { FolderPathService } from '../../os/path/folder-path/folder-path.service';
import { FolderService } from '../../os/folder/folder.service';
import { FilePathService } from '../../os/path/file-path/file-path.service';
import { FileService } from '../../os/file/file.service';
import { ProjectInitializationService } from './project-initialization.service';
import { join } from 'path';
import {
  CONFIG_FOLDER,
  META_DATA,
  RECORDING_FOLDER,
  RESULT_FOLDER,
  SETTINGS,
  SPECS,
} from '../../configs/project.config';
import { ProjectInfoDto } from '../../dto/project-info.dto';
import { existsSync, rmdirSync } from 'fs';
import { describe, beforeEach, it, expect, vi } from 'vitest';

const rootProject = join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  'tag_check_projects'
);
const initailzedProject = join(rootProject, 'newProject');
const recordingFolder = join(initailzedProject, RECORDING_FOLDER);
const reportSavingFolder = join(initailzedProject, RESULT_FOLDER);
const projectConfigFolder = join(initailzedProject, CONFIG_FOLDER);
const settings: ProjectInfoDto = {
  version: '1.0.0',
  rootProject: rootProject,
  projectName: 'projectName',
  projectDescription: 'projectDescription',
  projectSlug: 'projectSlug',
  measurementId: 'measurementId',
  googleSpreadsheetLink: 'googleSpreadsheetLink',
};
const settingsFile = join(initailzedProject, SETTINGS);
const metadataFile = join(initailzedProject, META_DATA);
const configFile = join(projectConfigFolder, SPECS);
const eventFolder = join(reportSavingFolder, 'eventId');

describe('ProjectInitializationService', () => {
  let service: ProjectInitializationService;
  let folderPathService: FolderPathService;
  let folderService: FolderService;
  let filePathService: FilePathService;
  let fileService: FileService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectInitializationService,
        FolderPathService,
        FolderService,
        FilePathService,
        FileService,
      ],
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize project', async () => {
    if (existsSync(initailzedProject))
      rmdirSync(initailzedProject, { recursive: true });
    const rootProjectPath = vi
      .spyOn(folderPathService, 'getRootProjectFolderPath')
      .mockResolvedValue(rootProject);
    const projectRoot = vi
      .spyOn(folderPathService, 'getProjectFolderPath')
      .mockResolvedValue(initailzedProject);
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
