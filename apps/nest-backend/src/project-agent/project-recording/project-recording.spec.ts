import { Test } from '@nestjs/testing';
import { join } from 'path';
import { ProjectRecordingService } from './project-recording.service';
import { FolderPathService } from '../../os/path/folder-path/folder-path.service';
import { FolderService } from '../../os/folder/folder.service';
import { FilePathService } from '../../os/path/file-path/file-path.service';
import { FileService } from '../../os/file/file.service';
import { RECORDING_FOLDER } from '../../configs/project.config';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('ProjectRecordingService', () => {
  let service: ProjectRecordingService;
  let fileService: FileService;
  let filePathService: FilePathService;
  let folderService: FolderService;
  let folderPathService: FolderPathService;
  const rootProjectPath = join(
    '..',
    '..',
    '..',
    '..',
    '..',
    'tag_check_projects'
  );

  const projectSlug = 'ng_gtm_integration_sample';
  const projectPath = join(rootProjectPath, projectSlug);
  const recordingPath = join(projectPath, RECORDING_FOLDER);
  const eventId = 'add_payment_info_0afeb0fe-0905-4a78-9b81-d171b0fa48ff';
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ProjectRecordingService],
    })
      .useMocker((token) => {
        if (token === FilePathService) {
          return {
            getRecordingFilePath: vi.fn(() => ''),
          };
        }

        if (token === FileService) {
          return {
            readJsonFile: vi.fn(() => ({})),
            writeJsonFile: vi.fn(),
          };
        }
        if (token === FolderPathService) {
          return {
            getRootProjectFolderPath: vi.fn(() => rootProjectPath),
            getProjectFolderPath: vi.fn(() => projectPath),
            getRecordingFolderPath: vi.fn().mockResolvedValue(recordingPath),
          };
        }

        if (token === FolderService) {
          return {
            getJsonFilesFromDir: vi.fn(() => []),
            deleteFolder: vi.fn(),
          };
        }

        if (typeof token === 'function') {
          return vi.fn();
        }
      })
      .compile();

    service = moduleRef.get<ProjectRecordingService>(ProjectRecordingService);
    fileService = moduleRef.get<FileService>(FileService);
    filePathService = moduleRef.get<FilePathService>(FilePathService);
    folderService = moduleRef.get<FolderService>(FolderService);
    folderPathService = moduleRef.get<FolderPathService>(FolderPathService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return project recordings', async () => {
    const projectSlug = 'project-slug';
    const result = await service.getProjectRecordings(projectSlug);

    expect(result).toBeDefined();
    expect(result.projectSlug).toBe(projectSlug);
    expect(result.recordings).toBeDefined();
  });

  it('should get project recording names', async () => {
    const result = await service.getProjectRecordingNames(projectSlug);
    expect(folderPathService.getRecordingFolderPath).toHaveBeenCalledWith(
      projectSlug
    );
    expect(folderService.getJsonFilesFromDir).toHaveBeenCalledWith(
      recordingPath
    );

    expect(result).toEqual([]);
  });

  it('should get recording details', async () => {
    await service.getRecordingDetails(projectSlug, eventId);
    expect(filePathService.getRecordingFilePath).toHaveBeenCalledWith(
      projectSlug,
      `${eventId}.json`
    );
    expect(fileService.readJsonFile).toHaveBeenCalled();
  });

  it('should add recording', async () => {
    const recording = {
      title: 'add_payment_info',
      steps: [],
    };
    await service.addRecording(projectSlug, eventId, recording);
    expect(filePathService.getRecordingFilePath).toHaveBeenCalledWith(
      projectSlug,
      `${eventId}.json`
    );
    expect(fileService.writeJsonFile).toHaveBeenCalled();
  });

  it('should update recording', async () => {
    const recording = {
      title: 'add_payment_info',
      steps: [],
    };
    await service.updateRecording(projectSlug, eventId, recording);
    expect(filePathService.getRecordingFilePath).toHaveBeenCalledWith(
      projectSlug,
      `${eventId}.json`
    );
    expect(fileService.writeJsonFile).toHaveBeenCalled();
  });
});
