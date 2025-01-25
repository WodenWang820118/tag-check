import { Test } from '@nestjs/testing';
import { ProjectReportService } from './project-report.service';
import { FolderPathService } from '../../infrastructure/os/path/folder-path/folder-path.service';
import { FolderService } from '../../infrastructure/os/folder/folder.service';
import { FilePathService } from '../../infrastructure/os/path/file-path/file-path.service';
import { FileService } from '../../infrastructure/os/file/file.service';
import { join } from 'path';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { ConfigsService } from '../../core/configs/configs.service';

describe('ProjectReportService', () => {
  let service: ProjectReportService;
  let configsService: ConfigsService;
  let rootProjectPath: string;
  let projectPath: string;
  let recordingPath: string;
  let projectSlug: string;
  let eventId: string;
  let reportSavingFolderPath: string;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ProjectReportService, ConfigsService]
    })
      .useMocker((token) => {
        if (token === FilePathService) {
          return {
            getRecordingFilePath: vi.fn(() => ''),
            getInspectionResultFilePath: vi.fn(() => '')
          };
        }

        if (token === FileService) {
          return {
            readJsonFile: vi.fn(() => ({})),
            writeJsonFile: vi.fn()
          };
        }
        if (token === FolderPathService) {
          return {
            getRootProjectFolderPath: vi.fn(() => rootProjectPath),
            getProjectFolderPath: vi.fn(() => projectPath),
            getRecordingFolderPath: vi.fn().mockResolvedValue(recordingPath),
            getReportSavingFolderPath: vi
              .fn()
              .mockResolvedValue(reportSavingFolderPath)
          };
        }

        if (token === FolderService) {
          return {
            readFolderFileNames: vi.fn(() => []),
            getJsonFilesFromDir: vi.fn(() => []),
            deleteFolder: vi.fn()
          };
        }

        if (typeof token === 'function') {
          return vi.fn();
        }
      })
      .compile();

    service = moduleRef.get<ProjectReportService>(ProjectReportService);
    configsService = moduleRef.get<ConfigsService>(ConfigsService);

    rootProjectPath = join('..', '..', '..', '..', '..', 'tag_check_projects');
    projectSlug = 'ng_gtm_integration_sample';
    projectPath = join(rootProjectPath, projectSlug);
    recordingPath = join(projectPath, configsService.getRECORDING_FOLDER());
    eventId = 'add_payment_info_0afeb0fe-0905-4a78-9b81-d171b0fa48ff';
    reportSavingFolderPath = join(recordingPath, eventId);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
