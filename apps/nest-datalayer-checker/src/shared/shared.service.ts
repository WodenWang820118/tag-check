import { Injectable } from '@nestjs/common';
import { FilePathOptions } from '../interfaces/filePathOptions.interface';
import { ProjectService } from './project/project.service';
import { FileService } from './file/file.service';
import { XlsxReportService } from './xlsx-report/xlsx-report.service';
import path from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { Page } from 'puppeteer';

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

  get settings() {
    return this.projectService.settings;
  }

  set settings(settings: any) {
    this.projectService.settings = settings;
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

  findDestinationUrl(json: any) {
    return this.fileService.findDestinationUrl(json);
  }

  getCachePath(projectName: string, operation: string) {
    return path.join(
      this.getReportSavingFolder(projectName),
      operation.replace('.json', ''),
      `${operation.replace('.json', '')} - result cache.json`
    );
  }

  getEventFolder(projectName: string, testName: string) {
    const resultFolder = this.getReportSavingFolder(projectName);
    const eventFolder = path.join(resultFolder, testName);
    return eventFolder;
  }

  initEventFolder(projectName: string, testName: string) {
    const resultFolder = this.getReportSavingFolder(projectName);
    const eventFolder = path.join(resultFolder, testName);
    if (!existsSync(eventFolder)) mkdirSync(eventFolder);
  }

  getProjectDomain(projectName: string, options: FilePathOptions) {
    const operation = this.getOperationJson(projectName, options);
    return operation.steps[1].url;
  }

  async screenshot(page: Page, projectName: string, testName: string) {
    const imageSavingFolder = path.join(
      this.getReportSavingFolder(projectName),
      testName
    );

    await page.screenshot({
      path: path.join(imageSavingFolder, `${testName}.png`),
    });
  }

  async writeCacheFile(projectName: string, operation: string, data: any) {
    const cachePath = this.getCachePath(projectName, operation);
    writeFileSync(cachePath, JSON.stringify(data, null, 2));
  }

  async writeXlsxFile(
    savingFolder: string,
    fileName: string,
    sheetName: string,
    data: any,
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
}
