import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ProjectService } from '../os/project/project.service';
import { FileService } from '../os/file/file.service';
import { SpecParser } from '@datalayer-checker/spec-parser';
import { ConfigurationService } from '../configuration/configuration.service';
import { mkdirSync } from 'fs';
import { ProjectInitializationService } from '../os/project-initialization/project-initialization.service';
import { FolderService } from '../os/folder/folder.service';
import { FolderPathService } from '../os/path/folder-path/folder-path.service';
import {
  CONFIG_CURRENT_PROJECT_PATH,
  CONFIG_ROOT_PATH,
} from '../configs/project.config';

// TODO: endpoints for the frontend to call
// please look at the collection of db.json files
@Injectable()
export class WaiterProjectService {
  specParser: SpecParser = new SpecParser();

  constructor(
    private fileService: FileService,
    private folderService: FolderService,
    private folderPathService: FolderPathService,
    private projectService: ProjectService,
    private configurationService: ConfigurationService,
    private projectInitializationService: ProjectInitializationService
  ) {}

  // 1)
  async setRootProjectFolder(rootProjectPath: string) {
    try {
      const configurations = await this.configurationService.findAll();
      mkdirSync(rootProjectPath, { recursive: true });
      if (configurations.length === 0) {
        Logger.log(
          'Creating initial root project folder path',
          'WaiterService'
        );
        return await this.configurationService.create({
          title: 'rootProjectPath',
          description: 'The root project path',
          value: rootProjectPath,
        });
      }

      const existingConfig = configurations.find(
        (item) => item.title === CONFIG_ROOT_PATH
      );

      if (existingConfig) {
        Logger.log(
          'Updating existing root project folder path',
          'WaiterService'
        );
        return this.configurationService.update(existingConfig.id, {
          title: 'rootProjectPath',
          value: rootProjectPath,
        });
      }
    } catch (error) {
      mkdirSync(rootProjectPath, { recursive: true });
      await this.configurationService.create({
        title: 'rootProjectPath',
        description: 'The root project path',
        value: rootProjectPath,
      });
      Logger.log(
        'Set root project folder path!',
        'WaiterService.setRootProjectFolder'
      );
    }
  }

  // 2) init project if not exists
  async initProject(projectName: string, settings: any) {
    try {
      // 1) check if project settings exists
      const configurations = await this.configurationService.findAll();
      const existingConfig = configurations.find(
        (item) => item.title === CONFIG_CURRENT_PROJECT_PATH
      );

      // 2) if exists, update it
      if (existingConfig) {
        Logger.log(
          'Current project folder existed! Update current project folder path',
          'WaiterService.setProject'
        );

        await this.configurationService.update(existingConfig.id, {
          title: 'currentProjectPath',
          value: projectName,
        });
        await this.projectInitializationService.initProject(
          projectName,
          settings
        );
      } else {
        Logger.log(
          'Current project folder not existed! Create current project folder path',
          'WaiterService.setProject'
        );

        await this.configurationService.create({
          title: 'currentProjectPath',
          description: 'The current project path',
          value: projectName,
        });
        await this.projectInitializationService.initProject(
          projectName,
          settings
        );
      }
    } catch (error) {
      Logger.error(error, 'WaiterService.setProject');
      throw new HttpException(error, 500);
    }
  }

  // 2) select project if exists
  async setProject(projectName: string) {
    try {
      const configurations = await this.configurationService.findAll();

      const existingConfig = configurations.find(
        (item) =>
          item.title === CONFIG_CURRENT_PROJECT_PATH &&
          item.value !== projectName
      );

      if (existingConfig) {
        Logger.log(
          'Current project folder existed! Update current project folder path',
          'WaiterService.setProject'
        );

        return this.configurationService.update(existingConfig.id, {
          title: 'currentProjectPath',
          value: projectName,
        });
      } else {
        Logger.log(
          'Current project folder not existed! Create current project folder path',
          'WaiterService.setProject'
        );

        return this.configurationService.create({
          title: 'currentProjectPath',
          description: 'The current project path',
          value: projectName,
        });
      }
    } catch (error) {
      Logger.error(error, 'WaiterService.setProject');
    }
  }

  async readImage(projectName: string, testName: string) {
    return await this.fileService.readImage(projectName, testName);
  }

  async getProjects() {
    return await this.projectService.getProjects();
  }

  async getProjectRecordings(projectName: string) {
    return this.folderService.getJsonFilesFromDir(
      await this.folderPathService.getRecordingFolderPath(projectName)
    );
  }

  async getEventReport(projectName: string, testName: string) {
    return await this.fileService.getEventReport(projectName, testName);
  }

  async readReport(projectName: string, reportName: string) {
    return await this.fileService.readReport(projectName, reportName);
  }

  async getSpecJsonByProject(projectName: string) {
    return await this.fileService.getSpecJsonByProject({ name: projectName });
  }
}
