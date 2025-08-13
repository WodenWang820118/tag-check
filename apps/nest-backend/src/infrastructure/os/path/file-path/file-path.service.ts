import { Injectable } from '@nestjs/common';
import { PathUtilsService } from '../path-utils/path-utils.service';
import { FolderPathService } from '../folder-path/folder-path.service';
import { join } from 'path';
import { extractEventNameFromId } from '@utils';
import { ConfigsService } from '../../../../core/configs/configs.service';

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

  async getProjectConfigFilePath(projectSlug: string) {
    return await this.pathUtilsService.buildFilePath(
      projectSlug,
      this.configsService.getCONFIG_FOLDER(),
      this.configsService.getSPECS()
    );
  }

  async getProjectSettingFilePath(projectSlug: string) {
    return await this.pathUtilsService.buildFilePath(
      projectSlug,
      '',
      this.configsService.getSETTINGS()
    );
  }

  async getProjectMetaDataFilePath(projectSlug: string) {
    return await this.pathUtilsService.buildFilePath(
      projectSlug,
      '',
      this.configsService.getMETA_DATA()
    );
  }

  async getReportFilePath(
    projectSlug: string,
    eventId: string,
    reportName: string
  ) {
    const reportSavingFolder =
      await this.folderPathService.getReportSavingFolderPath(projectSlug);
    const folderPath = join(reportSavingFolder, eventId, `${reportName}`);
    return folderPath;
  }

  async getCacheFilePath(projectSlug: string, eventId: string) {
    const filePath = join(
      await this.folderPathService.getReportSavingFolderPath(projectSlug),
      eventId,
      `${extractEventNameFromId(eventId)} - result cache.json`
    );
    return filePath;
  }

  async getImageFilePath(projectSlug: string, eventId: string) {
    const imageSavingFolder = join(
      await this.folderPathService.getReportSavingFolderPath(projectSlug),
      eventId
    );
    const filePath = join(
      imageSavingFolder,
      `${extractEventNameFromId(eventId)}.png`
    );
    return filePath;
  }

  async getInspectionResultFilePath(projectSlug: string, eventId: string) {
    const filePath = join(
      await this.folderPathService.getReportSavingFolderPath(projectSlug),
      eventId,
      this.configsService.getABSTRACT_REPORT_FILE_NAME()
    );
    return filePath;
  }

  async getRecordingFilePath(projectSlug: string, eventId: string) {
    return await this.pathUtilsService.buildFilePath(
      projectSlug,
      this.configsService.getRECORDING_FOLDER(),
      eventId
    );
  }

  async getMyDataLayerFilePath(projectSlug: string, eventId: string) {
    const resultFolder =
      await this.folderPathService.getReportSavingFolderPath(projectSlug);

    const eventName = extractEventNameFromId(eventId);
    const myDataLayerFile = join(
      resultFolder,
      eventId,
      `${eventName} - myDataLayer.json`
    );
    return myDataLayerFile;
  }
}
