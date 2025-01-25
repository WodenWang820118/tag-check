/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { FileService } from '../../infrastructure/os/file/file.service';
import { FolderService } from '../../infrastructure/os/folder/folder.service';
import { FolderPathService } from '../../infrastructure/os/path/folder-path/folder-path.service';
import { FullValidationResultService } from '../../test-result/services/full-validation-result.service';

@Injectable()
export class ProjectReportService {
  constructor(
    private readonly fileService: FileService,
    private readonly folderService: FolderService,
    private readonly folderPathService: FolderPathService,
    private readonly fullValidationResultService: FullValidationResultService
  ) {}

  async getProjectEventReports(projectSlug: string) {
    const reports =
      await this.fullValidationResultService.getReports(projectSlug);
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
