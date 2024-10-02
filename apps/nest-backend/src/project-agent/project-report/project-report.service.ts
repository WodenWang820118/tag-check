/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { FileService } from '../../os/file/file.service';
import { FolderService } from '../../os/folder/folder.service';
import { FolderPathService } from '../../os/path/folder-path/folder-path.service';
import { FilePathService } from '../../os/path/file-path/file-path.service';
import { IReportDetails } from '@utils';

@Injectable()
export class ProjectReportService {
  constructor(
    private readonly fileService: FileService,
    private readonly filePathService: FilePathService,
    private readonly folderService: FolderService,
    private readonly folderPathService: FolderPathService
  ) {}

  async getProjectEventReports(projectSlug: string) {
    const reportsPromise = (
      await this.getProjectEventReportFolderNames(projectSlug)
    ).map(async (folderName) => {
      return await this.buildEventReport(projectSlug, folderName);
    });

    const reports = await Promise.all(reportsPromise);
    return {
      projectSlug: projectSlug,
      reports: reports,
    };
  }

  async getProjectEventReportFolderNames(projectSlug: string) {
    return this.folderService.readFolderFileNames(
      await this.folderPathService.getReportSavingFolderPath(projectSlug)
    );
  }

  async buildEventReport(projectSlug: string, eventId: string) {
    const filePath = await this.filePathService.getInspectionResultFilePath(
      projectSlug,
      eventId
    );

    const report: IReportDetails = this.fileService.readJsonFile(filePath);

    return {
      ...report,
      eventId: eventId,
    };
  }

  async downloadXlsxReport(projectSlug: string, eventId: string) {
    return await this.fileService.getEventReport(projectSlug, eventId);
  }
}
