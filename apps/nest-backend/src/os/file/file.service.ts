import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  StreamableFile,
} from '@nestjs/common';
import {
  createReadStream,
  createWriteStream,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { FolderService } from '../folder/folder.service';
import { FolderPathService } from '../path/folder-path/folder-path.service';
import { FilePathService } from '../path/file-path/file-path.service';
import { join } from 'path';
import archiver from 'archiver';

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
      Logger.error(
        error,
        `${FileService.name}.${FileService.prototype.readJsonFile.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // get all json files in the project folder
  async getOperationJsonByProject(projectSlug: string) {
    try {
      const dirPath = await this.folderPathService.getRecordingFolderPath(
        projectSlug
      );
      const jsonFiles = this.folderService.getJsonFilesFromDir(dirPath);
      return jsonFiles.filter((file) => {
        file.endsWith('.json');
      });
    } catch (error) {
      Logger.error(
        error,
        `${FileService.name}.${FileService.prototype.getOperationJsonByProject.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // TODO: refactor; there might be multiple files
  async getEventReport(projectSlug: string, eventId: string) {
    try {
      const inspectionResultPath =
        await this.folderPathService.getInspectionEventFolderPath(
          projectSlug,
          eventId
        );
      const regex = new RegExp(`${eventId}.*\\.xlsx$`, 'i');
      const files =
        this.folderService.readFolderFileNames(inspectionResultPath);
      Logger.log(
        `Files: ${files}`,
        `${FileService.name}.${FileService.prototype.getEventReport.name}`
      );
      const filteredFiles = files.filter((file) => regex.test(file));

      const filePath = join(inspectionResultPath, filteredFiles[0]);

      return new StreamableFile(createReadStream(filePath));
    } catch (error) {
      Logger.error(
        error,
        `${FileService.name}.${FileService.prototype.getEventReport.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  downloadFile(filePath: string) {
    try {
      return new StreamableFile(createReadStream(filePath));
    } catch (error) {
      Logger.error(
        error,
        `${FileService.name}.${FileService.prototype.downloadFile.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async downloadFiles(filePaths: string[], outputFilePath: string) {
    const output = createWriteStream(outputFilePath);
    const archive = archiver('zip', {});

    output.on('close', () => {
      Logger.log(
        `Archive created successfully. Total bytes: ${archive.pointer()}`,
        `${FileService.name}.${FileService.prototype.downloadFiles.name}`
      );
    });

    archive.on('warning', (err: any) => {
      Logger.warn(
        'Archive warning: ' + err,
        `${FileService.name}.${FileService.prototype.downloadFiles.name}`
      );
    });

    archive.on('error', (err: any) => {
      Logger.error(
        'Archive error: ' + err,
        `${FileService.name}.${FileService.prototype.downloadFiles.name}`
      );
    });

    filePaths.forEach((filePath) => {
      const fileName = filePath.split('\\').at(-1);
      if (!fileName) {
        throw new HttpException(
          'File name not found',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
      archive.append(createReadStream(filePath), { name: fileName });
    });

    archive.pipe(output);
    // Must await the archive.finalize() to ensure the archive is fully written
    await archive.finalize();
  }

  async readReport(projectSlug: string, eventId: string, reportName: string) {
    try {
      const reportPath = await this.filePathService.getReportFilePath(
        projectSlug,
        eventId,
        reportName
      );

      return new StreamableFile(createReadStream(reportPath));
    } catch (error) {
      Logger.error(
        error,
        `${FileService.name}.${FileService.prototype.readReport.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  writeJsonFile(filePath: string, content: any) {
    writeFileSync(filePath, JSON.stringify(content, null, 2));
  }

  async writeCacheFile(projectSlug: string, eventId: string, data: any) {
    const cachePath = await this.filePathService.getCacheFilePath(
      projectSlug,
      eventId
    );
    this.writeJsonFile(cachePath, data);
  }

  deleteFile(filePath: string) {
    try {
      rmSync(filePath);
    } catch (error) {
      Logger.error(
        error,
        `${FileService.name}.${FileService.prototype.deleteFile.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
