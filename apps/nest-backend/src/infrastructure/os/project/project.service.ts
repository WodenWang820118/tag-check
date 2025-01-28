import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { FileService } from '../file/file.service';
import { FolderService } from '../folder/folder.service';
import { FolderPathService } from '../path/folder-path/folder-path.service';
import { FilePathService } from '../path/file-path/file-path.service';
import { Setting } from '@utils';

@Injectable()
export class ProjectService {
  constructor(
    private fileService: FileService,
    private folderService: FolderService,
    private folderPathService: FolderPathService,
    private filePathService: FilePathService
  ) {}

  async getProjectSettings(projectSlug: string) {
    const settingsFilePath =
      await this.filePathService.getProjectSettingFilePath(projectSlug);
    return this.fileService.readJsonFile<Setting>(settingsFilePath);
  }

  async getProjectsMetadata() {
    const projectRoot = await this.folderPathService.getRootProjectFolderPath();
    const projects = this.folderService
      .readFolderFiles(projectRoot)
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    // Map each project to a promise of its settings
    const projectSettingsPromises = projects.map(async (project) => {
      return this.getProjectMetadata(project);
    });

    // Resolve all promises before returning
    const projectsAll = await Promise.all(projectSettingsPromises);
    return projectsAll || [];
  }

  async getProjectMetadata(projectSlug: string) {
    const projectRoot = await this.folderPathService.getRootProjectFolderPath();
    const projectNames = this.folderService
      .readFolderFiles(projectRoot)
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    const project = projectNames.find((name) => name === projectSlug);

    if (!project) {
      throw new HttpException(
        `Project not found: ${projectSlug}`,
        HttpStatus.NOT_FOUND
      );
    }

    const metaData = await this.fileService.readJsonFile(
      await this.filePathService.getProjectMetaDataFilePath(project)
    );
    return metaData;
  }
}
