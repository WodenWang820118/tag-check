import { Test } from '@nestjs/testing';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { ProjectReportService } from './project-report.service';
import { FolderPathService } from '../../os/path/folder-path/folder-path.service';
import { FolderService } from '../../os/folder/folder.service';
import { FilePathService } from '../../os/path/file-path/file-path.service';
import { FileService } from '../../os/file/file.service';
import { RECORDING_FOLDER } from '../../configs/project.config';
import { join } from 'path';

const moduleMocker = new ModuleMocker(global);

describe('ProjectReportService', () => {
  let service: ProjectReportService;
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
  const reportSavingFolderPath = join(recordingPath, eventId);

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ProjectReportService],
    })
      .useMocker((token) => {
        if (token === FilePathService) {
          return {
            getRecordingFilePath: jest.fn(() => ''),
            getInspectionResultFilePath: jest.fn(() => ''),
          };
        }

        if (token === FileService) {
          return {
            readJsonFile: jest.fn(() => ({})),
            writeJsonFile: jest.fn(),
          };
        }
        if (token === FolderPathService) {
          return {
            getRootProjectFolderPath: jest.fn(() => rootProjectPath),
            getProjectFolderPath: jest.fn(() => projectPath),
            getRecordingFolderPath: jest.fn().mockResolvedValue(recordingPath),
            getReportSavingFolderPath: jest
              .fn()
              .mockResolvedValue(reportSavingFolderPath),
          };
        }

        if (token === FolderService) {
          return {
            readFolderFileNames: jest.fn(() => []),
            getJsonFilesFromDir: jest.fn(() => []),
            deleteFolder: jest.fn(),
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

    service = moduleRef.get<ProjectReportService>(ProjectReportService);
    fileService = moduleRef.get<FileService>(FileService);
    filePathService = moduleRef.get<FilePathService>(FilePathService);
    folderService = moduleRef.get<FolderService>(FolderService);
    folderPathService = moduleRef.get<FolderPathService>(FolderPathService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get project event reports', async () => {
    const getProjectEventReportFolderNamesSpy = jest.spyOn(
      service,
      'getProjectEventReportFolderNames'
    );

    const result = await service.getProjectEventReports(projectSlug);
    expect(getProjectEventReportFolderNamesSpy).toHaveBeenCalledWith(
      projectSlug
    );
    expect(result.projectSlug).toBe(projectSlug);
    expect(result.reports).toEqual([]);
  });

  it('should get project event report folder names', async () => {
    await service.getProjectEventReportFolderNames(projectSlug);
    expect(folderPathService.getReportSavingFolderPath).toHaveBeenCalledWith(
      projectSlug
    );
    expect(folderService.readFolderFileNames).toHaveBeenCalledWith(
      reportSavingFolderPath
    );
  });

  it('should build event report', async () => {
    await service.buildEventReport(projectSlug, eventId);
    expect(filePathService.getInspectionResultFilePath).toHaveBeenCalledWith(
      projectSlug,
      eventId
    );
    expect(fileService.readJsonFile).toHaveBeenCalled();
  });
});
