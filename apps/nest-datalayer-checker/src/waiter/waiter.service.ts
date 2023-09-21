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
}
