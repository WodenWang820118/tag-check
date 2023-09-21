import { Injectable } from '@nestjs/common';
import { FilePathOptions } from '../interfaces/filePathOptions.interface';
import { ProjectService } from './project/project.service';
import { FileService } from './file/file.service';

@Injectable()
export class SharedService {
  constructor(
    private readonly projectService: ProjectService,
    private readonly fileService: FileService
  ) {}

  get rootProjectFolder() {
    return this.projectService.rootProjectFolder;
  }

  set rootProjectFolder(rootProjectPath: string) {
    this.projectService.rootProjectFolder = rootProjectPath;
  }

  get projectFolder() {
    return this.projectService.projectFolder;
  }

  set projectFolder(projectPath: string) {
    this.projectService.projectFolder = projectPath;
  }

  initProject(projectName: string) {
    this.projectService.initProject(projectName);
  }

  getReportSavingFolder(projectName: string) {
    return this.fileService.getReportSavingFolder(projectName);
  }

  getOperationJson(projectName: string, options: FilePathOptions) {
    return this.fileService.getOperationJson(projectName, options);
  }

  getOperationJsonByProject(options: FilePathOptions) {
    return this.fileService.getOperationJsonByProject(options);
  }

  getSpecJsonByProject(options: FilePathOptions) {
    return this.fileService.getSpecJsonByProject(options);
  }
}
