import { existsSync } from 'fs';
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  StreamableFile
} from '@nestjs/common';
import {
  createReadStream,
  createWriteStream,
  readFileSync,
  rmSync,
  writeFileSync
} from 'fs';
import { FolderService } from '../folder/folder.service';
import { FolderPathService } from '../path/folder-path/folder-path.service';
import { FilePathService } from '../path/file-path/file-path.service';
import { join } from 'path';
import archiver from 'archiver';
import { IReportDetails } from '@utils';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  constructor(
    private folderService: FolderService,
    private folderPathService: FolderPathService,
    private filePathService: FilePathService
  ) {}

  readJsonFile<T>(filePath: string): T {
    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    const fileContent = readFileSync(`${filePath}`, 'utf8');
    const parsedData = JSON.parse(fileContent) as T;
    return parsedData;
  }

  // get all json files in the project folder
  async getOperationJsonByProject(projectSlug: string) {
    const dirPath =
      await this.folderPathService.getRecordingFolderPath(projectSlug);
    const jsonFiles = this.folderService
      .getJsonFilesFromDir(dirPath)
      .filter((file) => file.endsWith('.json'));

    if (!jsonFiles) {
      throw new NotFoundException('No JSON files found');
    }

    return jsonFiles;
  }

  // TODO: refactor; there might be multiple files
  async getEventReport(projectSlug: string, eventId: string) {
    const inspectionResultPath =
      await this.folderPathService.getInspectionEventFolderPath(
        projectSlug,
        eventId
      );
    const regex = new RegExp(`${eventId}.*\\.xlsx$`, 'i');
    const files = this.folderService.readFolderFileNames(inspectionResultPath);

    const filteredFiles = files.filter((file) => regex.test(file));
    const filePath = join(inspectionResultPath, filteredFiles[0]);
    return new StreamableFile(createReadStream(filePath));
  }

  downloadFile(filePath: string) {
    return new StreamableFile(createReadStream(filePath));
  }

  async downloadFiles(
    projectSlug: string,
    testResults: any[],
    outputFilePath: string
  ) {
    const output = createWriteStream(outputFilePath);
    const archive = archiver('zip', {});

    output.on('close', () => {
      this.logger.log(
        `Archive created successfully. Total bytes: ${archive.pointer()}`
      );
    });

    archive.on('warning', (err: any) => {
      this.logger.warn('Archive warning: ' + err);
    });

    archive.on('error', (err: any) => {
      this.logger.error('Archive error: ' + err);
    });

    testResults.forEach((testResult) => {
      const fileName = `${testResult.id}_${testResult.createdAt}'.xlsx'`;
      if (!fileName) {
        throw new HttpException(
          'File name not found',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
      archive.append(createReadStream(join(projectSlug, fileName)), {
        name: fileName
      });
    });

    archive.pipe(output);
    // Must await the archive.finalize() to ensure the archive is fully written
    await archive.finalize();
  }

  async readReport(projectSlug: string, eventId: string, reportName: string) {
    const reportPath = await this.filePathService.getReportFilePath(
      projectSlug,
      eventId,
      reportName
    );

    if (!existsSync(reportPath)) {
      throw new NotFoundException('Report not found');
    }

    return new StreamableFile(createReadStream(reportPath));
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
    rmSync(filePath);
  }
}
