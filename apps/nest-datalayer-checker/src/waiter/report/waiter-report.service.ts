import { Injectable } from '@nestjs/common';
import { FileService } from '../../os/file/file.service';
import { FolderService } from '../../os/folder/folder.service';
import { FolderPathService } from '../../os/path/folder-path/folder-path.service';
import { FilePathService } from '../../os/path/file-path/file-path.service';
import { AbstractReportService } from '../../os/abstract-report/abstract-report.service';
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

  // verified
  async getProjectReports(projectSlug: string) {
    const folderNames = this.folderService.readFolderFileNames(
      await this.folderPathService.getInspectionResultFolderPath(projectSlug)
    );

    const reportsPromise = folderNames.map(async (folderName) => {
      return {
        name: folderName,
        data: this.fileService.readJsonFile(
          await this.filePathService.getInspectionResultFilePath(
            projectSlug,
            folderName,
            ABSTRACT_REPORT_FILE_NAME
          )
        ),
      };
    });

    return await Promise.all(reportsPromise);
  }

  // TODO: haven't been tested
  async updateReport(projectSlug: string, report: any) {
    this.abstractReportService.writeSingleAbstractTestResultJson(
      projectSlug,
      report.eventName,
      report
    );
  }

  // TODO: haven't been tested
  // this method should be creating an empty new report
  async addReport(reportForm: any) {
    this.abstractReportService.writeProjectAbstractTestRsultJson(
      reportForm.projectSlug,
      reportForm.data
    );
  }
}
