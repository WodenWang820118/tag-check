import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  StreamableFile,
} from '@nestjs/common';
import { FilePathOptions } from '../interfaces/filePathOptions.interface';
import { ProjectService } from './project/project.service';
import { FileService } from './file/file.service';
import { XlsxReportService } from './xlsx-report/xlsx-report.service';
import path from 'path';
import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'fs';
import { Page } from 'puppeteer';

@Injectable()
export class SharedService {
  constructor(
    private readonly projectService: ProjectService,
    private readonly fileService: FileService,
    private readonly xlsxReportService: XlsxReportService
  ) {}

  getCachePath(projectName: string, operation: string) {
    return path.join(
      this.fileService.getReportSavingFolder(projectName),
      operation.replace('.json', ''),
      `${operation.replace('.json', '')} - result cache.json`
    );
  }

  getEventFolder(projectName: string, testName: string) {
    const resultFolder = this.fileService.getReportSavingFolder(projectName);
    const eventFolder = path.join(resultFolder, testName);
    return eventFolder;
  }

  initEventFolder(projectName: string, testName: string) {
    const resultFolder = this.fileService.getReportSavingFolder(projectName);
    const eventFolder = path.join(resultFolder, testName);
    if (!existsSync(eventFolder)) mkdirSync(eventFolder);
  }

  getProjectDomain(projectName: string, options: FilePathOptions) {
    const operation = this.fileService.getOperationJson(projectName, options);
    return operation.steps[1].url;
  }

  async screenshot(page: Page, projectName: string, testName: string) {
    const imageSavingFolder = path.join(
      this.fileService.getReportSavingFolder(projectName),
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

  async writeXlsxFileForAllTests(
    fileName: string,
    sheetName: string,
    projectName: string
  ) {
    const savingFolder = this.fileService.getReportSavingFolder(projectName);
    const operations = this.fileService.getOperationJsonByProject({
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

  readImage(projectName: string, testName: string) {
    try {
      const imageSavingFolder = path.join(
        this.fileService.getReportSavingFolder(projectName),
        testName
      );
      const imagePath = path.join(imageSavingFolder, `${testName}.png`);

      if (!existsSync(imagePath)) {
        throw new Error(`File not found: ${imagePath}`);
      }

      Logger.log(imagePath, 'SharedService.readImage');
      return new StreamableFile(createReadStream(imagePath));
    } catch (error) {
      Logger.error(`Error in readImage: ${error.message}`);
      throw new HttpException(
        'Error reading image',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  getProjectRecordings(projectName: string) {
    return this.fileService.getJsonFilesFromDir(
      this.projectService.getRecordingFolderPath(projectName)
    );
  }
}
