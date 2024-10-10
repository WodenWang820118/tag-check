import { Injectable, StreamableFile } from '@nestjs/common';
import { FileService } from '../../os/file/file.service';
import { FolderService } from '../../os/folder/folder.service';
import { FolderPathService } from '../../os/path/folder-path/folder-path.service';
import { join } from 'path';
import { createReadStream, mkdirSync, statSync } from 'fs';

@Injectable()
export class ProjectFileReportService {
  constructor(
    private readonly folderService: FolderService,
    private readonly folderPathService: FolderPathService,
    private readonly fileService: FileService
  ) {}

  async getReportFolders(projectSlug: string) {
    const folderPath = await this.folderPathService.getReportSavingFolderPath(
      projectSlug
    );
    const data = this.folderService.readFolder(folderPath);
    return data.map((dirent) => {
      return {
        name: dirent.name,
        path: join(dirent.parentPath, dirent.name),
      };
    });
  }

  async getReportFolderFiles(projectSlug: string) {
    const directories = await this.getReportFolders(projectSlug);
    let position = 0;

    const files = directories.map((directory) =>
      this.folderService.readFolderFiles(directory.path)
    );

    const fileDetails = files
      .flatMap((file) =>
        file.map((dirent) => {
          if (dirent.isFile() && dirent.name.endsWith('.xlsx')) {
            const filePath = join(dirent.parentPath, dirent.name);
            const stats = statSync(filePath);
            return {
              position: position++,
              name: dirent.name,
              path: filePath,
              lastModified: stats.mtime, // last modified time
            };
          }
          return null;
        })
      )
      .filter((file) => file !== null);

    return fileDetails;
  }

  async deleteReportFile(projectSlug: string, file: string) {
    this.fileService.deleteFile(file);
    return this.getReportFolders(projectSlug);
  }

  async deleteSelectedFiles(projectSlug: string, files: string[]) {
    files.forEach((file) => {
      this.fileService.deleteFile(file);
    });
    return this.getReportFolders(projectSlug);
  }

  async downloadReportFiles(files: string[]) {
    // Create a temporary folder to store the compressed zip file
    // This folder will be deleted after the file is downloaded
    const projectRootFolder =
      await this.folderPathService.getRootProjectFolderPath();
    const tempFolder = join(projectRootFolder, 'temp');
    mkdirSync(tempFolder, { recursive: true });

    const reportZipFile = join(tempFolder, `report.zip`);

    await this.fileService.downloadFiles(files, reportZipFile);
    const fileStream = createReadStream(reportZipFile);

    fileStream.on('close', () => {
      // Wait for the stream to close before deleting the folder
      this.folderService.deleteFolder(tempFolder);
    });

    return new StreamableFile(fileStream);
  }
}
