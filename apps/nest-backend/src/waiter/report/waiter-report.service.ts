import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { FileService } from '../../os/file/file.service';
import { FolderService } from '../../os/folder/folder.service';
import { FolderPathService } from '../../os/path/folder-path/folder-path.service';
import { FilePathService } from '../../os/path/file-path/file-path.service';
import { AbstractReportService } from '../../os/abstract-report/abstract-report.service';
import { IReportDetails } from '@utils';
import { ABSTRACT_REPORT_FILE_NAME } from '../../configs/project.config';

@Injectable()
export class WaiterReportService {
  constructor(
    private fileService: FileService,
    private filePathService: FilePathService,
    private folderService: FolderService,
    private folderPathService: FolderPathService,
    private abstractReportService: AbstractReportService
  ) {}

  async getProjectEventReports(projectSlug: string) {
    try {
      const reportsPromise = (
        await this.getProjectEventReportFolderNames(projectSlug)
      ).map(async (folderName) => {
        return await this.buildEventReport(
          projectSlug,
          folderName,
          ABSTRACT_REPORT_FILE_NAME
        );
      });

      const reports = await Promise.all(reportsPromise);
      return {
        projectSlug: projectSlug,
        reports: reports,
      };
    } catch (error) {
      Logger.error(error);
      throw new HttpException(
        'Failed to get project event reports',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getProjectEventReportFolderNames(projectSlug: string) {
    return this.folderService.readFolderFileNames(
      await this.folderPathService.getInspectionResultFolderPath(projectSlug)
    );
  }

  async buildEventReport(
    projectSlug: string,
    folderName: string,
    fileName: string
  ) {
    try {
      const filePath = await this.filePathService.getInspectionResultFilePath(
        projectSlug,
        folderName,
        fileName
      );

      const report: IReportDetails = this.fileService.readJsonFile(filePath);

      return {
        ...report,
        eventId: folderName,
      };
    } catch (error) {
      Logger.log(error.message, 'WaiterReportService.buildReport');
      throw new HttpException(
        'Failed to build report',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateReport(
    projectSlug: string,
    eventId: string,
    report: IReportDetails
  ) {
    await this.abstractReportService.writeSingleAbstractTestResultJson(
      projectSlug,
      eventId,
      report
    );
  }

  async addReport(
    projectSlug: string,
    eventId: string,
    report: IReportDetails
  ) {
    await this.abstractReportService.writeSingleAbstractTestResultJson(
      projectSlug,
      eventId,
      report
    );
  }

  async downloadXlsxReport(projectSlug: string, eventName: string) {
    return await this.fileService.getEventReport(projectSlug, eventName);
  }

  async deleteReport(projectSlug: string, eventId: string) {
    await this.abstractReportService.deleteSingleAbstractTestResultFolder(
      projectSlug,
      eventId
    );
  }
}
