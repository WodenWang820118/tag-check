import { SpecParser } from '@datalayer-checker/spec-parser';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigurationService } from '../../configuration/configuration.service';
import { ProjectInitializationService } from '../../os/project-initialization/project-initialization.service';
import { mkdirSync } from 'fs';
import {
  CONFIG_ROOT_PATH,
  CONFIG_CURRENT_PROJECT_PATH,
} from '../../configs/project.config';

@Injectable()
export class WaiterProjectWorkFlowService {
  specParser: SpecParser = new SpecParser();

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
          'WaiterProjectWorkFlowService'
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
          'WaiterProjectWorkFlowService'
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
        'WaiterProjectWorkFlowService.setRootProjectFolder'
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
          'WaiterProjectWorkFlowService.setProject'
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
          'WaiterProjectWorkFlowService.setProject'
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
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
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
          'WaiterProjectWorkFlowService.setProject'
        );

        return this.configurationService.update(existingConfig.id, {
          title: 'currentProjectPath',
          value: projectName,
        });
      } else {
        Logger.log(
          'Current project folder not existed! Create current project folder path',
          'WaiterProjectWorkFlowService.setProject'
        );

        return this.configurationService.create({
          title: 'currentProjectPath',
          description: 'The current project path',
          value: projectName,
        });
      }
    } catch (error) {
      Logger.error(error, 'WaiterProjectWorkFlowService.setProject');
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
