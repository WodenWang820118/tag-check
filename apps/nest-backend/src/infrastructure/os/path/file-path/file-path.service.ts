import { Injectable } from '@nestjs/common';
import { PathUtilsService } from '../path-utils/path-utils.service';
import { FolderPathService } from '../folder-path/folder-path.service';
import { join } from 'path';
import { extractEventNameFromId } from '@utils';
import { ConfigsService } from '../../../../core/configs/configs.service';

/**
 * Paths of the files a project keeps under its folder: recordings, run
 * results and the captured data layer. Each path is under the project's
 * folder (see PathUtilsService); the file may not exist yet.
 */
@Injectable()
export class FilePathService {
  constructor(
    private readonly pathUtilsService: PathUtilsService,
    private readonly folderPathService: FolderPathService,
    private readonly configsService: ConfigsService
  ) {}

  async getOperationFilePath(projectSlug: string, eventId: string) {
    const filePath = await this.pathUtilsService.buildFilePath(
      projectSlug,
      this.configsService.getRECORDING_FOLDER(),
      `${eventId}.json`
    );
    return filePath;
  }

  // The run-result paths start from the test's folder, which
  // getInspectionEventFolderPath checks stays inside the project: the
  // eventId comes from the request URL.
  async getInspectionResultFilePath(projectSlug: string, eventId: string) {
    return join(
      await this.folderPathService.getInspectionEventFolderPath(
        projectSlug,
        eventId
      ),
      this.configsService.getABSTRACT_REPORT_FILE_NAME()
    );
  }

  async getRecordingFilePath(projectSlug: string, eventId: string) {
    return await this.pathUtilsService.buildFilePath(
      projectSlug,
      this.configsService.getRECORDING_FOLDER(),
      eventId
    );
  }

  async getCacheFilePath(projectSlug: string, eventId: string) {
    return join(
      await this.folderPathService.getInspectionEventFolderPath(
        projectSlug,
        eventId
      ),
      `${extractEventNameFromId(eventId)} - result cache.json`
    );
  }

  async getMyDataLayerFilePath(projectSlug: string, eventId: string) {
    return join(
      await this.folderPathService.getInspectionEventFolderPath(
        projectSlug,
        eventId
      ),
      `${extractEventNameFromId(eventId)} - myDataLayer.json`
    );
  }
}
