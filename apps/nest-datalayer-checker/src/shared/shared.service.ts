import { Injectable } from '@nestjs/common';
import { FilePathOptions } from './interfaces/file-path-options.interface';
import { ProjectService } from './project/project.service';
import { FileService } from './file/file.service';
import { XlsxReportService } from './xlsx-report/xlsx-report.service';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Operation } from './interfaces/recording.interface';

@Injectable()
export class SharedService {
  constructor(
    private readonly projectService: ProjectService,
    private readonly fileService: FileService,
    private readonly xlsxReportService: XlsxReportService
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

  findDestinationUrl(json: Operation) {
    return this.fileService.findDestinationUrl(json);
  }

  async writeXlsxFile(
    savingFolder: string,
    fileName: string,
    sheetName: string,
    data: {
      dataLayerResult: any;
      requestCheckResult: any;
      rawRequest: any;
      destinationUrl: any;
    }[],
    testName?: string,
    projectName?: string
  ) {
    return await this.xlsxReportService.writeXlsxFile(
      savingFolder,
      fileName,
      sheetName,
      data,
      testName,
      projectName
    );
  }

  async writeXlsxFileForAllTests(
    fileName: string,
    sheetName: string,
    projectName: string
  ) {
    const savingFolder = this.getReportSavingFolder(projectName);
    const operations = this.getOperationJsonByProject({
      name: projectName,
    });
    return await this.xlsxReportService.writeXlsxFileForAllTests(
      savingFolder,
      operations,
      fileName,
      sheetName,
      projectName
    );
  }

  initEventFolder(projectName: string, testName: string) {
    const resultFolder = this.getReportSavingFolder(projectName);
    const eventFolder = path.join(resultFolder, testName);
    if (!existsSync(eventFolder)) mkdirSync(eventFolder);
  }

  getEventFolder(projectName: string, testName: string) {
    const resultFolder = this.getReportSavingFolder(projectName);
    const eventFolder = path.join(resultFolder, testName);
    return eventFolder;
  }
}
