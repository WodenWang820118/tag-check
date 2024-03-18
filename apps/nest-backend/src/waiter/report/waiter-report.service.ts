import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { FileService } from '../../os/file/file.service';
import { FolderService } from '../../os/folder/folder.service';
import { FolderPathService } from '../../os/path/folder-path/folder-path.service';
import { FilePathService } from '../../os/path/file-path/file-path.service';
import { AbstractReportService } from '../../os/abstract-report/abstract-report.service';
import { ABSTRACT_REPORT_FILE_NAME } from '../../configs/project.config';
import { statSync } from 'fs';

@Injectable()
export class WaiterReportService {
  constructor(
    private fileService: FileService,
    private filePathService: FilePathService,
    private folderService: FolderService,
    private folderPathService: FolderPathService,
    private abstractReportService: AbstractReportService
  ) {}

  // TODO: refactor and resue the method from the abstract-report.service
  async getProjectReports(projectSlug: string) {
    try {
      const folderNames = this.folderService.readFolderFileNames(
        await this.folderPathService.getInspectionResultFolderPath(projectSlug)
      );

      const reportsPromise = folderNames.map(async (folderName) => {
        const filePath = await this.filePathService.getInspectionResultFilePath(
          projectSlug,
          folderName,
          ABSTRACT_REPORT_FILE_NAME
        );

        const completedTime = statSync(filePath).mtime;
        return {
          eventName: folderName,
          ...this.fileService.readJsonFile(
            await this.filePathService.getInspectionResultFilePath(
              projectSlug,
              folderName,
              ABSTRACT_REPORT_FILE_NAME
            )
          ),
          completedTime,
        };
      });

      const reports = await Promise.all(reportsPromise);
      return {
        projectSlug: projectSlug,
        reports: reports,
      };
    } catch (error) {
      Logger.error(error);
      throw new HttpException(
        'Failed to get project reports',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // TODO: haven't been tested
  async updateReport(projectSlug: string, report: any) {
    this.abstractReportService.writeSingleAbstractTestResultJson(
      projectSlug,
      report.eventName,
      report
    );
  }

  async addReport(projectSlug: string, report: any) {
    this.abstractReportService.writeSingleAbstractTestResultJson(
      projectSlug,
      report.eventName,
      report
    );
  }

  async downloadXlsxReport(projectSlug: string, eventName: string) {
    return await this.fileService.getEventReport(projectSlug, eventName);
  }

  async deleteReport(projectSlug: string, eventName: string) {
    await this.abstractReportService.deleteSingleAbstractTestResultFolder(
      projectSlug,
      eventName
    );
  }
}
