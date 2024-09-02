import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigurationService } from '../../configuration/configuration.service';
import { ProjectInitializationService } from '../../project-agent/project-initialization/project-initialization.service';
import { mkdirSync } from 'fs';
import {
  CONFIG_ROOT_PATH,
  CONFIG_CURRENT_PROJECT_PATH,
} from '../../configs/project.config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WaiterProjectWorkFlowService {
  constructor(
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
          `${WaiterProjectWorkFlowService.name}.${WaiterProjectWorkFlowService.prototype.setRootProjectFolder.name}`
        );
        return await this.configurationService.create({
          id: uuidv4(),
          title: CONFIG_ROOT_PATH,
          description: 'The root project path',
          value: rootProjectPath,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const existingConfig = configurations.find(
        (item) => item.title === CONFIG_ROOT_PATH
      );

      if (existingConfig) {
        Logger.log(
          'Updating existing root project folder path',
          `${WaiterProjectWorkFlowService.name}.${WaiterProjectWorkFlowService.prototype.setRootProjectFolder.name}`
        );
        return this.configurationService.update(existingConfig.id, {
          title: CONFIG_ROOT_PATH,
          value: rootProjectPath,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      mkdirSync(rootProjectPath, { recursive: true });
      await this.configurationService.create({
        id: uuidv4(),
        title: CONFIG_ROOT_PATH,
        description: 'The root project path',
        value: rootProjectPath,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      Logger.log(
        'Set root project folder path!',
        `${WaiterProjectWorkFlowService.name}.${WaiterProjectWorkFlowService.prototype.setRootProjectFolder.name}`
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
          `${WaiterProjectWorkFlowService.name}.${WaiterProjectWorkFlowService.prototype.setProject.name}`
        );

        await this.configurationService.update(existingConfig.id, {
          title: CONFIG_CURRENT_PROJECT_PATH,
          value: projectName,
          updatedAt: new Date(),
        });
        await this.projectInitializationService.initProject(
          projectName,
          settings
        );
      } else {
        Logger.log(
          'Current project folder not existed! Create current project folder path',
          'WaiterProjectWorkFlowService.setProject'
        );

        await this.configurationService.create({
          id: uuidv4(),
          title: CONFIG_CURRENT_PROJECT_PATH,
          description: 'The current project path',
          value: projectName,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await this.projectInitializationService.initProject(
          projectName,
          settings
        );
      }
    } catch (error) {
      Logger.error(
        error,
        `${WaiterProjectWorkFlowService.name}.${WaiterProjectWorkFlowService.prototype.initProject.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
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
          `${WaiterProjectWorkFlowService.name}.${WaiterProjectWorkFlowService.prototype.setProject.name}`
        );

        return this.configurationService.update(existingConfig.id, {
          title: 'currentProjectPath',
          value: projectName,
        });
      } else {
        Logger.log(
          'Current project folder not existed! Create current project folder path',
          `${WaiterProjectWorkFlowService.name}.${WaiterProjectWorkFlowService.prototype.setProject.name}`
        );

        return this.configurationService.create({
          id: uuidv4(),
          title: 'currentProjectPath',
          description: 'The current project path',
          value: projectName,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      Logger.error(
        error,
        `${WaiterProjectWorkFlowService.name}.${WaiterProjectWorkFlowService.prototype.setProject.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
