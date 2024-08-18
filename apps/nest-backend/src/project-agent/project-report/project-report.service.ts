import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { FileService } from '../../os/file/file.service';
import { FolderService } from '../../os/folder/folder.service';
import { FolderPathService } from '../../os/path/folder-path/folder-path.service';
import { FilePathService } from '../../os/path/file-path/file-path.service';
import { IReportDetails } from '@utils';

@Injectable()
export class ProjectReportService {
  constructor(
    private fileService: FileService,
    private filePathService: FilePathService,
    private folderService: FolderService,
    private folderPathService: FolderPathService
  ) {}

  async getProjectEventReports(projectSlug: string) {
    try {
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
    } catch (error) {
      Logger.error(
        error,
        `${ProjectReportService.name}.${ProjectReportService.prototype.getProjectEventReports.name}`
      );
      throw new HttpException(
        'Failed to get project event reports',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getProjectEventReportFolderNames(projectSlug: string) {
    return this.folderService.readFolderFileNames(
      await this.folderPathService.getReportSavingFolderPath(projectSlug)
    );
  }

  async buildEventReport(projectSlug: string, eventId: string) {
    try {
      const filePath = await this.filePathService.getInspectionResultFilePath(
        projectSlug,
        eventId
      );

      const report: IReportDetails = this.fileService.readJsonFile(filePath);

      return {
        ...report,
        eventId: eventId,
      };
    } catch (error) {
      Logger.error(
        error,
        `${ProjectReportService.name}.${ProjectReportService.prototype.buildEventReport.name}`
      );
      throw new HttpException(
        'Failed to build report',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async downloadXlsxReport(projectSlug: string, eventId: string) {
    return await this.fileService.getEventReport(projectSlug, eventId);
  }
}
