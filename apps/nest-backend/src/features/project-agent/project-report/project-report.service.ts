import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { FolderService } from '../../../infrastructure/os/folder/folder.service';
import { FolderPathService } from '../../../infrastructure/os/path/folder-path/folder-path.service';

/** Prepares a test's folder for its run results on disk. */
@Injectable()
export class ProjectReportService {
  constructor(
    private readonly folderService: FolderService,
    private readonly folderPathService: FolderPathService
  ) {}

  /**
   * Creates `inspection_results/<eventId>` in the project's folder, where
   * runs write their recordings and result files.
   *
   * @throws HttpException 500 when the folder cannot be created.
   */
  async createEventReportFolder(projectSlug: string, eventId: string) {
    try {
      const eventFolderPath =
        await this.folderPathService.getInspectionEventFolderPath(
          projectSlug,
          eventId
        );
      this.folderService.createFolder(eventFolderPath);
    } catch (error) {
      Logger.error(error);
      throw new HttpException(
        error instanceof Error ? error.message : String(error),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
