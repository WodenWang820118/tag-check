import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { FileService } from '../../os/file/file.service';
import { FolderService } from '../../os/folder/folder.service';
import { FolderPathService } from '../../os/path/folder-path/folder-path.service';
import { FilePathService } from '../../os/path/file-path/file-path.service';
import { AbstractDatalayerReportService } from '../../os/abstract-datalayer-report/abstract-datalayer-report.service';
import { statSync } from 'fs';
import { OutputValidationResult } from '../../interfaces/dataLayer.interface';
import { ABSTRACT_REPORT_FILE_NAME } from '../../configs/project.config';

@Injectable()
export class WaiterReportService {
  constructor(
    private fileService: FileService,
    private filePathService: FilePathService,
    private folderService: FolderService,
    private folderPathService: FolderPathService,
    private abstractDatalayerReportService: AbstractDatalayerReportService
  ) {}

  async getProjectEventReports(projectSlug: string) {
    try {
      const reportsPromise = (
        await this.getEventReportFolderNames(projectSlug)
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

  async getEventReportFolderNames(projectSlug: string) {
    return this.folderService.readFolderFileNames(
      await this.folderPathService.getInspectionResultFolderPath(projectSlug)
    );
  }

  async buildEventReport(
    projectSlug: string,
    eventName: string,
    fileName: string
  ) {
    try {
      const filePath = await this.filePathService.getInspectionResultFilePath(
        projectSlug,
        eventName,
        fileName
      );

      const report: OutputValidationResult =
        this.fileService.readJsonFile(filePath);

      const completedTime = statSync(filePath).mtime;
      const reportContent = {
        eventName: eventName,
        ...report,
        completedTime,
      };

      return reportContent;
    } catch (error) {
      Logger.log(error.message, 'WaiterReportService.buildReport');
      throw new HttpException(
        'Failed to build report',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // TODO: haven't been tested
  async updateReport(projectSlug: string, report: any) {
    await this.abstractDatalayerReportService.writeSingleAbstractTestResultJson(
      projectSlug,
      report.eventName,
      report
    );
  }

  async addReport(projectSlug: string, report: any) {
    await this.abstractDatalayerReportService.writeSingleAbstractTestResultJson(
      projectSlug,
      report.eventName,
      report
    );
  }

  async downloadXlsxReport(projectSlug: string, eventName: string) {
    return await this.fileService.getEventReport(projectSlug, eventName);
  }

  async deleteReport(projectSlug: string, eventName: string) {
    await this.abstractDatalayerReportService.deleteSingleAbstractTestResultFolder(
      projectSlug,
      eventName
    );
  }
}
