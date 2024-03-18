import { FolderService } from './../folder/folder.service';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ValidationResult } from '../../interfaces/dataLayer.interface';
import { FolderPathService } from '../path/folder-path/folder-path.service';
import { existsSync, mkdirSync, statSync, writeFileSync } from 'fs';
import { FilePathService } from '../path/file-path/file-path.service';
import { ABSTRACT_REPORT_FILE_NAME } from '../../configs/project.config';
import { FileService } from '../file/file.service';

@Injectable()
export class AbstractReportService {
  constructor(
    private folderPathService: FolderPathService,
    private folderService: FolderService,
    private filePathService: FilePathService,
    private fileService: FileService
  ) {}

  async writeSingleAbstractTestResultJson(
    projectName: string,
    eventName: string,
    data: ValidationResult
  ) {
    try {
      const reportPath =
        await this.folderPathService.getInspectionEventFolderPath(
          projectName,
          eventName
        );

      if (!existsSync(reportPath)) {
        mkdirSync(reportPath);
      }

      const abstractPath =
        await this.filePathService.getInspectionResultFilePath(
          projectName,
          eventName,
          ABSTRACT_REPORT_FILE_NAME
        );

      writeFileSync(abstractPath, JSON.stringify(data, null, 2));
    } catch (error) {
      Logger.error(
        error.message,
        'AbstractReportService.writeSingleAbstractTestResultJson'
      );
      throw new HttpException(
        'Failed to write report',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async writeProjectAbstractTestRsultJson(
    projectName: string,
    data: ValidationResult[]
  ) {
    // TODO: haven't verified the function
    const resultFolderPath =
      await this.folderPathService.getInspectionResultFolderPath(projectName);

    const eventFolderNames = this.folderService
      .readFolderFiles(resultFolderPath)
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const name of eventFolderNames) {
      for (const dataPiece of data) {
        if (name === dataPiece.dataLayerSpec.event) {
          const abstractFilePath =
            await this.filePathService.getInspectionResultFilePath(
              projectName,
              name,
              ABSTRACT_REPORT_FILE_NAME
            );
          writeFileSync(abstractFilePath, JSON.stringify(data, null, 2));
        }
      }
    }
  }

  async deleteSingleAbstractTestResultFolder(
    projectSlug: string,
    eventName: string
  ) {
    try {
      const folderPath =
        await this.folderPathService.getInspectionEventFolderPath(
          projectSlug,
          eventName
        );

      if (!existsSync(folderPath)) {
        throw new HttpException('Report not found', HttpStatus.NOT_FOUND);
      }

      this.folderService.deleteFolder(folderPath);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      Logger.log(
        error.message,
        'AbstractReportService.deleteSingleAbstractTestResultFolder'
      );
      throw new HttpException(
        'Failed to delete report',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getSingleAbstractTestResultJson(
    projectSlug: string,
    eventName: string
  ) {
    try {
      const filePath = await this.filePathService.getInspectionResultFilePath(
        projectSlug,
        eventName,
        ABSTRACT_REPORT_FILE_NAME
      );

      if (!existsSync(filePath)) {
        throw new HttpException('Report not found', HttpStatus.NOT_FOUND);
      }

      const completedTime = statSync(filePath).mtime;

      return {
        eventName: eventName,
        ...this.fileService.readJsonFile(filePath),
        completedTime,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(
        error.message,
        'AbstractReportService.getSingleAbstractTestResultJson'
      );
      throw new HttpException('Failed to read report', HttpStatus.BAD_REQUEST);
    }
  }
}
