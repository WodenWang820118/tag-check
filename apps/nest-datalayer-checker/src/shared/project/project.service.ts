import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'fs';
import path from 'path';
import { configFolder, recordingFolder, resultFolder } from '../utilities';
import { cwd } from 'process';

@Injectable()
export class ProjectService implements OnModuleInit {
  rootProjectPath = '';
  projectPath = '';
  private settingsFilePath = '';
  // TODO: temporary solution for backend only
  private cachedSettingsFilePath: string = path.join(
    cwd(),
    'cachedSettings.json'
  );

  async onModuleInit() {
    // Load cached settings if available
    if (existsSync(this.cachedSettingsFilePath)) {
      const rawData = readFileSync(this.cachedSettingsFilePath, 'utf8');
      const settings = JSON.parse(rawData);
      console.log('settings', settings);
      this.rootProjectPath = settings.rootProjectPath || '';
      this.projectPath = settings.currentProjectPath || '';
    } else {
      // Initialize with default values or do nothing
    }
  }

  updateSettingsFilePath() {
    this.settingsFilePath = path.join(
      this.rootProjectPath,
      this.projectPath,
      'settings.json'
    );
  }

  updateCachedSettings() {
    const cachedSettings = {
      rootProjectPath: this.rootProjectPath,
      currentProjectPath: this.projectPath,
    };
    writeFileSync(
      this.cachedSettingsFilePath,
      JSON.stringify(cachedSettings, null, 2)
    );
  }

  createFolder(folderPath: string) {
    // console.log('folderPath', folderPath);
    if (!existsSync(folderPath)) {
      mkdirSync(folderPath);
    }
  }

  initProject(projectName: string) {
    const projectRoot = path.join(this.rootProjectPath, projectName);
    // console.log('projectRoot', projectRoot);
    try {
      this.createFolder(projectRoot);
      this.createFolder(path.join(projectRoot, recordingFolder));
      this.createFolder(path.join(projectRoot, resultFolder));
      this.createFolder(path.join(projectRoot, configFolder));
    } catch (error) {
      Logger.error(error, 'ProjectService.initProject');
    }

    // Update current project settings
    this.projectPath = projectName;
    this.updateSettingsFilePath();

    // Save settings
    const settings = {
      rootProject: this.rootProjectPath,
      project: this.projectPath,
      name: `${this.projectPath}`,
      version: '1.0.0',
    };
    this.settings = settings;
    this.updateCachedSettings();
  }

  get cachedSettings() {
    if (existsSync(this.cachedSettingsFilePath)) {
      const rawData = readFileSync(this.cachedSettingsFilePath, 'utf8');
      return JSON.parse(rawData);
    } else {
      return {};
    }
  }

  get settings() {
    const rootProjectPath = this.cachedSettings.rootProjectPath;
    const currentProjectPath = this.cachedSettings.currentProjectPath;
    const settingsFilePath = path.join(
      rootProjectPath,
      currentProjectPath,
      'settings.json'
    );
    Logger.log(settingsFilePath, 'ProjectService.settings');
    if (existsSync(settingsFilePath)) {
      const rawData = readFileSync(settingsFilePath, 'utf8');
      return JSON.parse(rawData);
    } else {
      return {};
    }
  }

  set settings(settings: any) {
    writeFileSync(this.settingsFilePath, JSON.stringify(settings, null, 2));
  }

  get projects() {
    const projects = existsSync(this.rootProjectPath)
      ? readdirSync(this.rootProjectPath, { withFileTypes: true })
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => dirent.name)
      : [];
    return projects;
  }

  get rootProjectFolder() {
    return this.rootProjectPath;
  }

  set rootProjectFolder(rootProjectPath: string) {
    this.rootProjectPath = rootProjectPath;
    this.createFolder(rootProjectPath);
    this.updateSettingsFilePath();
    this.updateCachedSettings();
  }

  get projectFolder() {
    return this.projectPath;
  }

  set projectFolder(projectPath: string) {
    this.projectPath = projectPath;
    this.updateSettingsFilePath();
    this.updateCachedSettings();
  }

  getRecordingFolderPath(projectName: string) {
    return path.join(this.rootProjectPath, projectName, recordingFolder);
  }
}
