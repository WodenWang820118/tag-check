import { FolderService } from './../folder/folder.service';
import { Injectable, Logger } from '@nestjs/common';
import { ValidationResult } from '../../interfaces/dataLayer.interface';
import { FolderPathService } from '../path/folder-path/folder-path.service';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { FilePathService } from '../path/file-path/file-path.service';
import { ABSTRACT_REPORT_FILE_NAME } from '../../configs/project.config';

@Injectable()
export class AbstractReportService {
  constructor(
    private folderPathService: FolderPathService,
    private folderService: FolderService,
    private filePathService: FilePathService
  ) {}

  async writeSingleAbstractTestResultJson(
    projectName: string,
    eventName: string,
    data: ValidationResult
  ) {
    const reportPath =
      await this.folderPathService.getInspectionEventFolderPath(
        projectName,
        eventName
      );

    if (!existsSync(reportPath)) {
      mkdirSync(reportPath);
    }

    const abstractPath = await this.filePathService.getInspectionResultFilePath(
      projectName,
      eventName,
      ABSTRACT_REPORT_FILE_NAME
    );

    writeFileSync(abstractPath, JSON.stringify(data, null, 2));
  }

  async writeProjectAbstractTestRsultJson(
    projectName: string,
    data: ValidationResult[]
  ) {
    // TODO: haven't verified the function
    const resultFolderPath =
      await this.folderPathService.getInspectionResultFolderPath(projectName);

    const eventFolderNames = this.folderService
      .readFolderFiles(resultFolderPath)
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const name of eventFolderNames) {
      for (const dataPiece of data) {
        if (name === dataPiece.dataLayerSpec.event) {
          const abstractFilePath =
            await this.filePathService.getInspectionResultFilePath(
              projectName,
              name,
              ABSTRACT_REPORT_FILE_NAME
            );
          writeFileSync(abstractFilePath, JSON.stringify(data, null, 2));
        }
      }
    }
  }
}
