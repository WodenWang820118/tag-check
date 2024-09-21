/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigurationService } from '../../configuration/configuration.service';
import { ProjectInitializationService } from '../../project-agent/project-initialization/project-initialization.service';
import { mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ConfigsService } from '../../configs/configs.service';
import { Log } from '../../logging-interceptor/logging-interceptor.service';

@Injectable()
export class WaiterProjectWorkFlowService {
  constructor(
    private configurationService: ConfigurationService,
    private projectInitializationService: ProjectInitializationService,
    private configsService: ConfigsService
  ) {}

  // 1)
  @Log()
  async setRootProjectFolder(rootProjectPath: string) {
    try {
      const configurations = await this.configurationService.findAll();
      mkdirSync(rootProjectPath, { recursive: true });
      if (configurations.length === 0) {
        return await this.configurationService.create({
          id: uuidv4(),
          title: this.configsService.getCONFIG_ROOT_PATH(),
          description: 'The root project path',
          value: rootProjectPath,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const existingConfig = configurations.find(
        (item) => item.title === this.configsService.getCONFIG_ROOT_PATH()
      );

      if (existingConfig) {
        return this.configurationService.update(existingConfig.id, {
          title: this.configsService.getCONFIG_ROOT_PATH(),
          value: rootProjectPath,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      mkdirSync(rootProjectPath, { recursive: true });
      await this.configurationService.create({
        id: uuidv4(),
        title: this.configsService.getCONFIG_ROOT_PATH(),
        description: 'The root project path',
        value: rootProjectPath,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  // 2) init project if not exists
  @Log()
  async initProject(projectName: string, settings: any) {
    try {
      // 1) check if project settings exists
      const configurations = await this.configurationService.findAll();
      const existingConfig = configurations.find(
        (item) =>
          item.title === this.configsService.getCONFIG_CURRENT_PROJECT_PATH()
      );

      // 2) if exists, update it
      if (existingConfig) {
        await this.configurationService.update(existingConfig.id, {
          title: this.configsService.getCONFIG_CURRENT_PROJECT_PATH(),
          value: projectName,
          updatedAt: new Date(),
        });
        await this.projectInitializationService.initProject(
          projectName,
          settings
        );
      } else {
        await this.configurationService.create({
          id: uuidv4(),
          title: this.configsService.getCONFIG_CURRENT_PROJECT_PATH(),
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
  @Log()
  async setProject(projectName: string) {
    try {
      const configurations = await this.configurationService.findAll();

      const existingConfig = configurations.find(
        (item) =>
          item.title === this.configsService.getCONFIG_CURRENT_PROJECT_PATH() &&
          item.value !== projectName
      );

      if (existingConfig) {
        return this.configurationService.update(existingConfig.id, {
          title: 'currentProjectPath',
          value: projectName,
        });
      } else {
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
