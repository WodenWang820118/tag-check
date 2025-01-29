import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { SysConfigurationRepositoryService } from '../../core/repository/sys-configuration/sys-configuration-repository.service';
import { ProjectInitializationService } from '../../features/project-agent/project-initialization/project-initialization.service';
import { mkdirSync } from 'fs';
import { ConfigsService } from '../../core/configs/configs.service';
import { CreateProjectDto } from '../../shared';

@Injectable()
export class ProjectWorkFlowControllerService {
  private readonly logger = new Logger(ProjectWorkFlowControllerService.name);
  constructor(
    private readonly configurationService: SysConfigurationRepositoryService,
    private readonly projectInitializationService: ProjectInitializationService,
    private readonly configsService: ConfigsService
  ) {}

  // 1)
  async setRootProjectFolder(rootProjectPath: string) {
    try {
      const configurations = await this.configurationService.findAll();
      mkdirSync(rootProjectPath, { recursive: true });
      if (configurations.length === 0) {
        return this.configurationService.create({
          name: this.configsService.getCONFIG_ROOT_PATH(),
          description: 'The root project path',
          value: rootProjectPath
        });
      }

      const existingConfig = configurations.find(
        (item) => item.name === this.configsService.getCONFIG_ROOT_PATH()
      );

      if (existingConfig) {
        return this.configurationService.update(existingConfig.id, {
          name: this.configsService.getCONFIG_ROOT_PATH(),
          value: rootProjectPath
        });
      }
    } catch (error) {
      mkdirSync(rootProjectPath, { recursive: true });
      this.logger.warn(error);
      this.configurationService.create({
        name: this.configsService.getCONFIG_ROOT_PATH(),
        description: 'The root project path',
        value: rootProjectPath
      });
    }
  }

  // 2) init project if not exists
  async initProject(projectSlug: string, settings: CreateProjectDto) {
    try {
      // 1) check if project settings exists
      const configurations = await this.configurationService.findAll();
      const existingConfig = configurations.find(
        (item) =>
          item.name === this.configsService.getCONFIG_CURRENT_PROJECT_PATH()
      );

      // 2) if exists, update it
      if (existingConfig) {
        await this.configurationService.update(existingConfig.id, {
          name: this.configsService.getCONFIG_CURRENT_PROJECT_PATH(),
          value: projectSlug
        });
        await this.projectInitializationService.initProject(
          projectSlug,
          settings
        );
      } else {
        this.configurationService.create({
          name: this.configsService.getCONFIG_CURRENT_PROJECT_PATH(),
          description: 'The current project path',
          value: projectSlug
        });

        await this.projectInitializationService.initProject(
          projectSlug,
          settings
        );
      }
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 2) select project if exists
  async setProject(projectSlug: string) {
    try {
      const configurations = await this.configurationService.findAll();

      const existingConfig = configurations.find(
        (item) =>
          item.name === this.configsService.getCONFIG_CURRENT_PROJECT_PATH() &&
          item.value !== projectSlug
      );

      if (existingConfig) {
        return this.configurationService.update(existingConfig.id, {
          name: 'currentProjectPath',
          value: projectSlug
        });
      } else {
        return this.configurationService.create({
          name: 'currentProjectPath',
          description: 'The current project path',
          value: projectSlug
        });
      }
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
