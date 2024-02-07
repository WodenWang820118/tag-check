import { FolderService } from './../folder/folder.service';
import { Injectable } from '@nestjs/common';
import { ValidationResult } from '../../interfaces/dataLayer.interface';
import { FolderPathService } from '../path/folder-path/folder-path.service';
import { writeFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class AbstractReportService {
  constructor(
    private folderPathService: FolderPathService,
    private folderService: FolderService
  ) {}

  async writeSingleAbstractTestResultJson(
    projectName: string,
    eventName: string,
    data: ValidationResult
  ) {
    // TODO: haven't verified the function
    const eventReportPath =
      await this.folderPathService.getInspectionEventFolderPath(
        projectName,
        eventName
      );
    const abstractPath = join(eventReportPath, 'abstract.json');
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
          const abstractFilePath = join(
            resultFolderPath,
            name,
            'abstract.json'
          );
          writeFileSync(abstractFilePath, JSON.stringify(data, null, 2));
        }
      }
    }
  }
}
