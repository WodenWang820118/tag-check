import { map } from 'rxjs';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { FileService } from '../file/file.service';
import { FolderService } from '../folder/folder.service';
import { FolderPathService } from '../path/folder-path/folder-path.service';
import { FilePathService } from '../path/file-path/file-path.service';
import { join } from 'path';
import { statSync } from 'fs';

/**
 * @description
 */
@Injectable()
export class ProjectService {
  constructor(
    private fileService: FileService,
    private folderService: FolderService,
    private folderPathService: FolderPathService,
    private filePathService: FilePathService
  ) {}
  async getSettings(projectName: string) {
    try {
      const settingsFilePath =
        await this.filePathService.getProjectSettingFilePath(projectName);
      return this.fileService.readJsonFile(settingsFilePath);
    } catch (error) {
      Logger.error(error.message, 'ProjectService.getSettings');
      throw new HttpException(error.message, 500);
    }
  }

  async getProjectSettings(projectName: string) {
    try {
      const settingsFilePath =
        await this.filePathService.getProjectSettingFilePath(projectName);
      return this.fileService.readJsonFile(settingsFilePath);
    } catch (error) {
      Logger.error(error.message, 'ProjectService.getProjectSettings');
      throw new HttpException(error.message, 500);
    }
  }

  async getProjectDataLayerRecordings(projectName: string) {
    try {
      const recordingPath = await this.folderPathService.getRecordingFolderPath(
        projectName
      );
      const recordings = this.folderService.readFolderFiles(recordingPath);
      return recordings;
    } catch (error) {
      Logger.error(
        error.message,
        'ProjectService.getProjectDataLayerRecordings'
      );
      throw new HttpException(error.message, 500);
    }
  }

  async getProjectDataLayerInspectionResults(projectName: string) {
    try {
      const results = [];

      const resultFolderPath =
        await this.folderPathService.getInspectionResultFolderPath(projectName);

      const eventFolderNames = this.folderService
        .readFolderFiles(resultFolderPath)
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      for (const name of eventFolderNames) {
        const filePath = join(resultFolderPath, name, 'abstract.json');
        const abstractResult = this.fileService.readJsonFile(filePath);

        const completedTime = statSync(filePath).mtime;

        // TODO: get file written time as completedTime
        results.push({
          eventName: name,
          completedTime: completedTime,
          ...abstractResult,
        });
      }
      return results;
    } catch (error) {
      Logger.error(
        error.message,
        'ProjectService.getProjectDataLayerInspectionResults'
      );
      throw new HttpException(error.message, 500);
    }
  }

  async getProjects() {
    try {
      const projectRoot =
        await this.folderPathService.getRootProjectFolderPath();
      const projects = this.folderService
        .readFolderFiles(projectRoot)
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      // Logger.log(projects, 'ProjectService.getProjects');
      // Map each project to a promise of its settings
      const projectSettingsPromises = projects.map(async (project) => {
        return this.getProject(project);
      });

      // Resolve all promises before returning
      const projectsAll = await Promise.all(projectSettingsPromises);

      // Logger.log(projectsAll, 'ProjectService.getProjects');
      return projectsAll;
    } catch (error) {
      Logger.error(error.message, 'ProjectService.getProjects');
      throw new HttpException(error.message, 500);
    }
  }

  async getProject(projectSlug: string) {
    try {
      const projectRoot =
        await this.folderPathService.getRootProjectFolderPath();
      const projectNames = this.folderService
        .readFolderFiles(projectRoot)
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      const project = projectNames.find((name) => name === projectSlug);

      const settings = await this.getProjectSettings(project);
      const recordings = (
        await this.getProjectDataLayerRecordings(project)
      ).map((item) => item && item.name.replace('.json', ''));
      const reports = (
        await this.getProjectDataLayerInspectionResults(project)
      ).map((item) => item && item.eventName);
      const specs = (
        await this.fileService.getSpecJsonByProject({
          name: project,
        })
      ).map((item: { event: any }) => item && item.event);

      return {
        projectName: project,
        ...settings,
        recordings: recordings,
        specs: specs,
        reports: reports,
      };
    } catch (error) {
      Logger.error(error.message, 'ProjectService.getProject');
    }
  }
}
