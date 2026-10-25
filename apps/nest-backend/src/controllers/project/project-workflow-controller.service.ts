import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ProjectInitializationService } from '../../features/project-agent/project-initialization/project-initialization.service';
import { CreateProjectDto } from '../../shared';

/** Creates a project's folders and rows. */
@Injectable()
export class ProjectWorkFlowControllerService {
  private readonly logger = new Logger(ProjectWorkFlowControllerService.name);
  constructor(
    private readonly projectInitializationService: ProjectInitializationService
  ) {}

  /** Creates the project. Rejects with a 500 HttpException when that fails. */
  async initProject(projectSlug: string, settings: CreateProjectDto) {
    try {
      return await this.projectInitializationService.initProjectFileSystem(
        projectSlug,
        settings
      );
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        error instanceof Error ? error.message : String(error),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
