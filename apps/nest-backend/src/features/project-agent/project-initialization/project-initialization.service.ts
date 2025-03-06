import { Injectable } from '@nestjs/common';
import { FolderService } from '../../../infrastructure/os/folder/folder.service';
import { FolderPathService } from '../../../infrastructure/os/path/folder-path/folder-path.service';
import { ProjectFacadeRepositoryService } from '../../repository/project-facade/project-facade-repository.service';
import { CreateProjectDto } from '../../../shared';

@Injectable()
export class ProjectInitializationService {
  constructor(
    private readonly folderService: FolderService,
    private readonly folderPathService: FolderPathService,
    private readonly projectFacadeService: ProjectFacadeRepositoryService
  ) {}

  async initProjectFileSystem(projectSlug: string, settings: CreateProjectDto) {
    await this.createProjectFolders(projectSlug); // keep project folders for videos
    return await this.projectFacadeService.createProject(settings);
  }

  private async createProjectFolders(projectSlug: string) {
    const projectRoot =
      await this.folderPathService.getProjectFolderPath(projectSlug);
    this.folderService.createFolder(projectRoot);
    this.folderService.createFolder(
      await this.folderPathService.getRecordingFolderPath(projectSlug)
    );
    this.folderService.createFolder(
      await this.folderPathService.getReportSavingFolderPath(projectSlug)
    );
    this.folderService.createFolder(
      await this.folderPathService.getProjectConfigFolderPath(projectSlug)
    );
  }

  async initInspectionEventSavingFolder(projectName: string, eventId: string) {
    const eventFolder =
      await this.folderPathService.getInspectionEventFolderPath(
        projectName,
        eventId
      );
    this.folderService.createFolder(eventFolder);
  }
}
