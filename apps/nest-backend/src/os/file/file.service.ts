import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  StreamableFile,
} from '@nestjs/common';
import { createReadStream, existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { FolderService } from '../folder/folder.service';
import { FolderPathService } from '../path/folder-path/folder-path.service';
import { FilePathService } from '../path/file-path/file-path.service';

/**
 * Service responsible for file operations such as reading JSON files, retrieving file paths, and handling reports.
 */
@Injectable()
export class FileService {
  constructor(
    private folderService: FolderService,
    private folderPathService: FolderPathService,
    private filePathService: FilePathService
  ) {}

  readJsonFile(filePath: string) {
    try {
      return JSON.parse(readFileSync(`${filePath}`, 'utf8'));
    } catch (error) {
      Logger.error(error.message, 'FileService.readJsonFile');
      throw new HttpException(error.message, 500);
    }
  }

  async getOperationJsonByProject(projectSlug: string) {
    try {
      const dirPath =
        await this.folderPathService.getOperationJsonPathByProject(projectSlug);
      const jsonFiles = this.folderService.getJsonFilesFromDir(dirPath);
      return jsonFiles.filter((file) => {
        file.endsWith('.json');
      });
    } catch (error) {
      Logger.error(error.message, 'FileService.getOperationJsonByProject');
      throw new HttpException(error.message, 500);
    }
  }

  async getEventReport(projectSlug: string, testName: string) {
    try {
      const inspectionResultPath =
        await this.folderPathService.getInspectionResultFolderPath(projectSlug);
      if (!existsSync(inspectionResultPath)) {
        throw new BadRequestException(`Project ${projectSlug} does not exist!`);
      }
      // use regex and testName to get an array of XLSX files
      const regex = new RegExp(`${testName}.*.xlsx`);
      const files =
        this.folderService.readFolderFileNames(inspectionResultPath);
      const filteredFiles = files.filter((file) => regex.test(file));

      if (filteredFiles.length === 0) {
        throw new BadRequestException(`Test ${testName} does not exist!`);
      }

      return filteredFiles;
    } catch (error) {
      Logger.error(error.message, 'FileService.getEventReport');
      throw new HttpException(error.message, 500);
    }
  }

  async readReport(projectSlug: string, reportName: string) {
    try {
      const reportPath = await this.filePathService.getReportFilePath(
        projectSlug,
        reportName
      );

      return new StreamableFile(createReadStream(reportPath));
    } catch (error) {
      Logger.error(error.message, 'FileService.readReport');
      throw new HttpException(error.message, 500);
    }
  }

  // async readImage(projectSlug: string, testName: string) {
  //   try {
  //     const imageSavingFolder = path.join(
  //       await this.folderPathService.getReportSavingFolderPath(projectSlug),
  //       testName
  //     );
  //     const imagePath = path.join(imageSavingFolder, `${testName}.png`);

  //     if (!existsSync(imagePath)) {
  //       throw new Error(`File not found: ${imagePath}`);
  //     }

  //     Logger.log(imagePath, 'SharedService.readImage');
  //     return new StreamableFile(createReadStream(imagePath));
  //   } catch (error) {
  //     Logger.error(error.message, 'FileService.readImage');
  //     throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
  //   }
  // }

  async writeJsonFile(filePath: string, content: any) {
    writeFileSync(filePath, JSON.stringify(content, null, 2));
  }

  async writeCacheFile(projectSlug: string, operation: string, data: any) {
    const cachePath = await this.filePathService.getCacheFilePath(
      projectSlug,
      operation
    );
    this.writeJsonFile(cachePath, data);
  }
}
