import { Injectable } from '@nestjs/common';
import { SharedService } from '../shared/shared.service';
import path from 'path';

@Injectable()
export class WaiterService {
  constructor(private sharedService: SharedService) {}

  // 1)
  selectRootProjectFolder(rootProjectPath: string) {
    this.sharedService.rootProjectFolder = rootProjectPath;
  }

  // 2)
  initProject(projectName: string) {
    this.sharedService.initProject(projectName);
  }

  selectProject(projectName: string) {
    this.sharedService.projectFolder = projectName;
  }

  writeXlsxFile(filename: string, filePath: string, sheetName: string) {
    // TODO: arrange the actual data
    const data = [
      {
        name: 'John Doe',
        age: 24,
      },
      {
        name: 'Jane Doe',
        age: 25,
      },
    ];
    this.sharedService.writeXlsxFile(filename, filePath, sheetName, data);
  }
}
