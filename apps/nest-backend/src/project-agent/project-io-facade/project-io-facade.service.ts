import {
  BadRequestException,
  Injectable,
  Logger,
  StreamableFile
} from '@nestjs/common';
import { ProjectIoService } from '../../infrastructure/os/project-io/project-io.service';
import { FolderPathService } from '../../infrastructure/os/path/folder-path/folder-path.service';
import { join } from 'path';
import { createReadStream, mkdirSync } from 'fs';
import { FolderService } from '../../infrastructure/os/folder/folder.service';

@Injectable()
export class ProjectIoFacadeService {
  private logger = new Logger(ProjectIoFacadeService.name);
  constructor(
    private readonly projectIoService: ProjectIoService,
    private readonly folderPathService: FolderPathService,
    private readonly folderService: FolderService
  ) {}

  async exportProject(projectSlug: string) {
    if (!projectSlug) {
      throw new BadRequestException('Project slug is required');
    }
    const projectPath =
      await this.folderPathService.getProjectFolderPath(projectSlug);
    const tempFolder = await this.createTempFolder();
    const projectZipPath = join(tempFolder, `${projectSlug}.zip`);

    await this.projectIoService.compressProject(projectPath, projectZipPath);
    const fileStream = createReadStream(projectZipPath);

    fileStream.on('close', () => {
      // Wait for the stream to close before deleting the folder
      this.folderService.deleteFolder(tempFolder);
      this.cleanupTempFolder(tempFolder);
    });

    return new StreamableFile(fileStream);
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

  private async createTempFolder(): Promise<string> {
    const projectRootFolderPath =
      await this.folderPathService.getRootProjectFolderPath();
    const tempFolder = join(projectRootFolderPath, 'temp');
    mkdirSync(tempFolder, { recursive: true });
    return tempFolder;
  }

  private cleanupTempFolder(tempFolder: string) {
    try {
      this.folderService.deleteFolder(tempFolder);
    } catch (error) {
      this.logger.error(`Error cleaning up temp folder`);
    }
  }
}
