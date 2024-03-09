import { Injectable, StreamableFile } from '@nestjs/common';
import { ProjectIoService } from '../../os/project-io/project-io.service';
import { FolderPathService } from '../../os/path/folder-path/folder-path.service';
import { join } from 'path';
import { createReadStream, mkdirSync } from 'fs';
import { FolderService } from '../../os/folder/folder.service';

@Injectable()
export class WaiterProjectIoService {
  constructor(
    private projectIoService: ProjectIoService,
    private folderPathService: FolderPathService,
    private folderService: FolderService
  ) {}

  async exportProject(projectSlug: string) {
    const projectRootFolderPath =
      await this.folderPathService.getRootProjectFolderPath();
    const projectPath = await this.folderPathService.getProjectFolderPath(
      projectSlug
    );
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
}
