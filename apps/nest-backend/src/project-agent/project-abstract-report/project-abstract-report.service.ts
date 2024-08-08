import { FolderService } from '../../os/folder/folder.service';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { IReportDetails, OutputValidationResult } from '@utils';
import { FolderPathService } from '../../os/path/folder-path/folder-path.service';
import { existsSync, mkdirSync, statSync } from 'fs';
import { FilePathService } from '../../os/path/file-path/file-path.service';
import { FileService } from '../../os/file/file.service';

@Injectable()
export class ProjectAbstractReportService {
  constructor(
    private folderPathService: FolderPathService,
    private folderService: FolderService,
    private filePathService: FilePathService,
    private fileService: FileService
  ) {}

  async writeSingleAbstractTestResultJson(
    projectSlug: string,
    eventId: string,
    data: OutputValidationResult
  ) {
    try {
      const folderPath =
        await this.folderPathService.getInspectionEventFolderPath(
          projectSlug,
          `${eventId}`
        );

      const abstractPath =
        await this.filePathService.getInspectionResultFilePath(
          projectSlug,
          `${eventId}`
        );

      if (!existsSync(folderPath)) {
        mkdirSync(`${folderPath}`, { recursive: true });
      }

      if (!existsSync(abstractPath)) {
        this.fileService.writeJsonFile(abstractPath, data);
      } else {
        const report = this.fileService.readJsonFile(
          abstractPath
        ) as IReportDetails;
        const updatedReport = { ...report, ...data };
        this.fileService.writeJsonFile(abstractPath, updatedReport);
      }
    } catch (error) {
      Logger.error(
        error.message,
        'ProjectAbstractReportService.writeSingleAbstractTestResultJson'
      );
      throw new HttpException(
        'ProjectAbstractReportService.writeSingleAbstractTestResultJson',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // TODO: haven't verified the function
  async writeProjectAbstractTestRsultJson(
    projectName: string,
    data: OutputValidationResult[]
  ) {
    const resultFolderPath =
      await this.folderPathService.getReportSavingFolderPath(projectName);

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
              name
            );
          // writeFileSync(abstractFilePath, JSON.stringify(data, null, 2));
          this.fileService.writeJsonFile(abstractFilePath, dataPiece);
        }
      }
    }
  }

  async deleteSingleAbstractTestResultFolder(
    projectSlug: string,
    eventId: string
  ) {
    try {
      const folderPath =
        await this.folderPathService.getInspectionEventFolderPath(
          projectSlug,
          eventId
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
        'ProjectAbstractReportService.deleteSingleAbstractTestResultFolder'
      );
      throw new HttpException(
        'Failed to delete report',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getSingleAbstractTestResultJson(projectSlug: string, eventId: string) {
    try {
      const filePath = await this.filePathService.getInspectionResultFilePath(
        projectSlug,
        eventId
      );

      if (!existsSync(filePath)) {
        throw new HttpException(
          `Report not found: ${filePath}`,
          HttpStatus.NOT_FOUND
        );
      }

      const completedTime = statSync(filePath).mtime;

      return {
        eventName: eventId,
        ...this.fileService.readJsonFile(filePath),
        completedTime,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(
        error.message,
        'ProjectAbstractReportService.getSingleAbstractTestResultJson'
      );
      throw new HttpException('Failed to read report', HttpStatus.BAD_REQUEST);
    }
  }
}
