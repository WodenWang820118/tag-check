/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { FileService } from '../../../infrastructure/os/file/file.service';
import { FolderService } from '../../../infrastructure/os/folder/folder.service';
import { FolderPathService } from '../../../infrastructure/os/path/folder-path/folder-path.service';
import { TestEventRepositoryService } from '../../../core/repository/test-event/test-event-repository.service';

@Injectable()
export class ProjectReportService {
  constructor(
    private readonly fileService: FileService,
    private readonly folderService: FolderService,
    private readonly folderPathService: FolderPathService,
    private readonly testEventRepositoryService: TestEventRepositoryService
  ) {}

  async getProjectEventReports(projectSlug: string) {
    const reports =
      await this.testEventRepositoryService.listReports(projectSlug);
    return {
      projectSlug: projectSlug,
      reports: reports
    };
  }

  async getProjectEventReportFolderNames(projectSlug: string) {
    return this.folderService.readFolderFileNames(
      await this.folderPathService.getReportSavingFolderPath(projectSlug)
    );
  }

  async downloadXlsxReport(projectSlug: string, eventId: string) {
    return await this.fileService.getEventReport(projectSlug, eventId);
  }
}
