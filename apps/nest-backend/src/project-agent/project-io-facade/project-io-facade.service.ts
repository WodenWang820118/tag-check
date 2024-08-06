import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  StreamableFile,
} from '@nestjs/common';
import { ProjectIoService } from '../../os/project-io/project-io.service';
import { FolderPathService } from '../../os/path/folder-path/folder-path.service';
import { join } from 'path';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { FolderService } from '../../os/folder/folder.service';

@Injectable()
export class ProjectIoFacadeService {
  constructor(
    private projectIoService: ProjectIoService,
    private folderPathService: FolderPathService,
    private folderService: FolderService
  ) {}

  async exportProject(projectSlug: string) {
    try {
      const projectRootFolderPath =
        await this.folderPathService.getRootProjectFolderPath();
      const projectPath = await this.folderPathService.getProjectFolderPath(
        projectSlug
      );

      if (!existsSync(projectPath)) {
        throw new HttpException(
          `Project with slug ${projectSlug} not found; absolute path: ${projectPath}`,
          HttpStatus.NOT_FOUND
        );
      }

      const tempFolder = join(projectRootFolderPath, 'temp');
      mkdirSync(tempFolder, { recursive: true });

      const projectZipPath = join(tempFolder, `${projectSlug}.zip`);

      await this.projectIoService.compressProject(projectPath, projectZipPath);
      const fileStream = createReadStream(projectZipPath);

      fileStream.on('close', () => {
        // Wait for the stream to close before deleting the folder
        this.folderService.deleteFolder(tempFolder);
      });

      return new StreamableFile(fileStream);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(error.message, 'ProjectIoFacadeService.exportProject');
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async importProject(
    projectSlug: string,
    zipFilePath: string,
    outputFolderPath: string
  ) {
    await this.projectIoService.unzipProject(
      projectSlug,
      zipFilePath,
      outputFolderPath
    );
  }

  async deleteProject(projectSlug: string) {
    this.folderService.deleteFolder(
      await this.folderPathService.getProjectFolderPath(projectSlug)
    );
  }
}
