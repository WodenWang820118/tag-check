import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { ConfigurationService } from '../../../core/configuration/configuration.service';
@Injectable()
export class PathUtilsService {
  constructor(private configurationService: ConfigurationService) {}

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
    const dbRootProjectPath =
      await this.configurationService.getRootProjectPath();

    const outputPath = join(dbRootProjectPath, projectSlug, folderName);
    // only returing path since it could be used for creating folder
    return outputPath;
  }
}
