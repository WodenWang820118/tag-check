import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  StreamableFile,
} from '@nestjs/common';
import { createReadStream, readFileSync, writeFileSync } from 'fs';
import { FolderService } from '../folder/folder.service';
import { FolderPathService } from '../path/folder-path/folder-path.service';
import { FilePathService } from '../path/file-path/file-path.service';
import { join } from 'path';

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
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
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
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getEventReport(projectSlug: string, eventName: string) {
    try {
      const inspectionResultPath =
        await this.folderPathService.getInspectionEventFolderPath(
          projectSlug,
          eventName
        );
      const regex = new RegExp(`${eventName}.*\\.xlsx$`, 'i');
      const files =
        this.folderService.readFolderFileNames(inspectionResultPath);
      Logger.log(`Files: ${files}`);
      const filteredFiles = files.filter((file) => regex.test(file));

      const filePath = join(inspectionResultPath, filteredFiles[0]);

      return new StreamableFile(createReadStream(filePath));
    } catch (error) {
      Logger.error(error.message, 'FileService.getEventReport');
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
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
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

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
