import { TestResultService } from './../../test-result/services/test-result.service';
import { Injectable, Logger } from '@nestjs/common';
import { FolderService } from '../../os/folder/folder.service';
import { FolderPathService } from '../../os/path/folder-path/folder-path.service';
import { join } from 'path';
import { XlsxReportService } from '../../os/xlsx-report/xlsx-report.service';
import { FullValidationResultService } from '../../test-result/services/full-validation-result.service';

@Injectable()
export class ProjectFileReportService {
  constructor(
    private readonly folderService: FolderService,
    private readonly folderPathService: FolderPathService,
    private readonly testResultService: TestResultService,
    private readonly fullValidationResultService: FullValidationResultService,
    private readonly xlsxReportService: XlsxReportService
  ) {}

  async getReportFolders(projectSlug: string) {
    const folderPath =
      await this.folderPathService.getReportSavingFolderPath(projectSlug);
    const data = this.folderService.readFolder(folderPath);
    return data.map((dirent) => {
      return {
        name: dirent.name,
        path: join(dirent.parentPath, dirent.name)
      };
    });
  }

  async getReportFolderFiles(projectSlug: string) {
    return await this.testResultService.list(projectSlug);
  }

  async deleteReportFile(projectSlug: string, eventId: string) {
    return this.testResultService.delete(projectSlug, eventId);
  }

  async deleteSelectedFiles(projectSlug: string, eventIds: string[]) {
    return this.testResultService.deleteMany(projectSlug, eventIds);
  }

  async downloadReportFiles(projectSlug: string, eventIds: string[]) {
    const reports =
      await this.fullValidationResultService.getReportDetailsData(eventIds);
    if (!reports || reports.length === 0) {
      throw new Error('No reports found');
    }
    return await this.xlsxReportService.writeXlsxFile(reports);
  }
}
