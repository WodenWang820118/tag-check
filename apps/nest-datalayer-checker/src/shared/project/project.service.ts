import { HttpException, Injectable, Logger } from '@nestjs/common';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'fs';
import path from 'path';
import { configFolder, recordingFolder, resultFolder } from '../utilities';
import { ConfigurationService } from '../../configuration/configuration.service';

@Injectable()
export class ProjectService {
  constructor(private configurationService: ConfigurationService) {}
  createFolder(folderPath: string) {
    if (!existsSync(folderPath)) {
      mkdirSync(folderPath);
    }
  }

  async initProject(projectName: string, settings: any) {
    try {
      const dbRootProjectPath =
        await this.configurationService.getRootProjectPath();
      const dbCurrentProjectPath =
        await this.configurationService.getCurrentProjectPath();
      const projectRoot = path.join(dbRootProjectPath, projectName);
      this.createFolder(projectRoot);
      this.createFolder(path.join(projectRoot, recordingFolder));
      this.createFolder(path.join(projectRoot, resultFolder));
      this.createFolder(path.join(projectRoot, configFolder));

      const projectSettings = {
        rootProject: `${dbRootProjectPath}`,
        projectName: `${dbCurrentProjectPath}`,
        projectDescription: `${dbCurrentProjectPath}`,
        projectSlug: `${settings.projectSlug}`,
        testType: `${settings.testType}`,
        googleSpreadsheetLink: `${settings.googleSpreadsheetLink}`,
        tagManagerUrl: `${settings.tagManagerUrl}`,
        gtmId: `${settings.gtmId}`,
        containerName: `${settings.containerName}`,
        version: '1.0.0',
      };
      const settingsFilePath = path.join(
        dbRootProjectPath,
        dbCurrentProjectPath,
        'settings.json'
      );

      this.setSsettings(settingsFilePath, projectSettings);
    } catch (error) {
      Logger.error(error, 'ProjectService.initProject');
    }
  }

  async getSettings() {
    try {
      const dbRootProjectPath =
        await this.configurationService.getRootProjectPath();
      const dbCurrentProjectPath =
        await this.configurationService.getCurrentProjectPath();
      const settingsFilePath = path.join(
        dbRootProjectPath,
        dbCurrentProjectPath,
        'settings.json'
      );
      if (existsSync(settingsFilePath)) {
        const rawData = readFileSync(settingsFilePath, 'utf8');
        return JSON.parse(rawData);
      } else {
        return {};
      }
    } catch (error) {
      Logger.error(error, 'ProjectService.settings');
    }
  }

  setSsettings(settingsFilePath: string, settings: any) {
    writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
  }

  async getProjectSettings(projectName: string) {
    const dbRootProjectPath =
      await this.configurationService.getRootProjectPath();
    return readFileSync(
      path.join(dbRootProjectPath, projectName, 'settings.json'),
      'utf8'
    );
  }

  async getProjects() {
    const dbRootProjectPath =
      await this.configurationService.getRootProjectPath();
    const projects = existsSync(dbRootProjectPath)
      ? readdirSync(dbRootProjectPath, { withFileTypes: true })
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => dirent.name)
      : [];

    // Map each project to a promise of its settings
    const projectSettingsPromises = projects.map(async (project) => {
      const projectSettings = await this.getProjectSettings(project);
      return {
        name: project,
        settings: projectSettings,
      };
    });

    // Resolve all promises before returning
    const projectsAll = await Promise.all(projectSettingsPromises);

    Logger.log(projectsAll, 'ProjectService.getProjects');
    return projectsAll;
  }

  async getRootProjectFolder() {
    return await this.configurationService.getRootProjectPath();
  }

  async getProjectFolder() {
    return await this.configurationService.getCurrentProjectPath();
  }

  async getRecordingFolderPath(projectName: string) {
    try {
      const dbRootProjectPath =
        await this.configurationService.getRootProjectPath();
      const dbCurrentProjectPath =
        await this.configurationService.getCurrentProjectPath();
      const filePath2 = path.join(
        dbRootProjectPath,
        dbCurrentProjectPath,
        projectName,
        recordingFolder
      );
      return filePath2;
    } catch (error) {
      Logger.error(error, 'FileService.buildFilePath');
      throw new HttpException(error, 500);
    }
  }
}
