import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { SysConfigurationRepositoryService } from '../../../../core/repository/sys-configuration/sys-configuration-repository.service';
@Injectable()
export class PathUtilsService {
  constructor(
    private configurationService: SysConfigurationRepositoryService
  ) {}

  async buildFilePath(
    projectName: string,
    folderName: string,
    fileName: string
  ) {
    const dbRootProjectPath =
      await this.configurationService.getRootProjectPath();

    const outputPath = join(
      dbRootProjectPath,
      projectName,
      folderName,
      fileName || ''
    );
    // only returing path since it could be used for creating file
    return outputPath;
  }

  async buildFolderPath(projectSlug: string, folderName: string) {
    const dbRootProjectPathConfig =
      await this.configurationService.getRootProjectPath();

    const outputPath = join(dbRootProjectPathConfig, projectSlug, folderName);
    // only returing path since it could be used for creating folder
    return outputPath;
  }
}
