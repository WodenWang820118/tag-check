/* eslint-disable @typescript-eslint/no-unsafe-return */
import { FolderService } from '../../os/folder/folder.service';
import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { IReportDetails, OutputValidationResult } from '@utils';
import { FolderPathService } from '../../os/path/folder-path/folder-path.service';
import { existsSync, mkdirSync, statSync } from 'fs';
import { FilePathService } from '../../os/path/file-path/file-path.service';
import { FileService } from '../../os/file/file.service';

@Injectable()
export class ProjectAbstractReportService {
  private readonly logger = new Logger(ProjectAbstractReportService.name);
  constructor(
    private readonly folderPathService: FolderPathService,
    private readonly folderService: FolderService,
    private readonly filePathService: FilePathService,
    private readonly fileService: FileService
  ) {}

  async writeSingleAbstractTestResultJson(
    projectSlug: string,
    eventId: string,
    data: Partial<OutputValidationResult>
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
        const report =
          this.fileService.readJsonFile<IReportDetails>(abstractPath);
        const updatedReport = { ...report, ...data };
        this.fileService.writeJsonFile(abstractPath, updatedReport);
      }
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Failed to write report');
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
        throw new NotFoundException(`Report not found: ${folderPath}`);
      }

      this.folderService.deleteFolder(folderPath);
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.error(error);
        throw error;
      }

      this.logger.error(error);
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
        throw new NotFoundException(`Report not found: ${filePath}`);
      }

      const completedTime = statSync(filePath).mtime;

      return {
        // eventName: eventId,
        ...this.fileService.readJsonFile<IReportDetails>(filePath),
        completedTime
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(error);
      throw new HttpException('Failed to read report', HttpStatus.BAD_REQUEST);
    }
  }
}
