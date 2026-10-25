import { Injectable } from '@nestjs/common';
import { PathUtilsService } from '../path-utils/path-utils.service';
import { join } from 'path';
import { SysConfigurationRepositoryService } from '../../../../core/repository/sys-configuration/sys-configuration-repository.service';
import { ConfigsService } from '../../../../core/configs/configs.service';

/**
 * Paths of a project's folders: the root, the project, its recordings,
 * config and run results. Each is checked to stay inside the projects folder
 * (see PathUtilsService); the folder may not exist yet.
 */
@Injectable()
export class FolderPathService {
  constructor(
    private readonly pathUtilsService: PathUtilsService,
    private readonly configurationService: SysConfigurationRepositoryService,
    private readonly configsService: ConfigsService
  ) {}

  async getRootProjectFolderPath() {
    const folderPath = await this.configurationService.getRootProjectPath();
    return folderPath;
  }

  async getReportSavingFolderPath(projectSlug: string) {
    const folderPath = await this.pathUtilsService.buildFolderPath(
      projectSlug,
      this.configsService.getRESULT_FOLDER()
    );
    return folderPath;
  }

  async getProjectFolderPath(projectSlug: string) {
    const folderPath = await this.pathUtilsService.buildFolderPath(
      projectSlug,
      ''
    );
    return folderPath;
  }

  async getRecordingFolderPath(projectSlug: string) {
    const folderPath = await this.pathUtilsService.buildFolderPath(
      projectSlug,
      this.configsService.getRECORDING_FOLDER()
    );
    return folderPath;
  }

  async getProjectConfigFolderPath(projectSlug: string) {
    const folderPath = await this.pathUtilsService.buildFolderPath(
      projectSlug,
      this.configsService.getCONFIG_FOLDER()
    );
    return folderPath;
  }

  async getInspectionEventFolderPath(projectSlug: string, eventId: string) {
    const folderPath = await this.pathUtilsService.buildFolderPath(
      projectSlug,
      join(this.configsService.getRESULT_FOLDER(), eventId)
    );
    return folderPath;
  }
}
