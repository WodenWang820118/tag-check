import { Injectable } from '@nestjs/common';
import { ProjectService } from '../../os/project/project.service';

@Injectable()
export class ProjectMetadataService {
  constructor(private projectService: ProjectService) {}

  async getProjectsMetadata() {
    return await this.projectService.getProjectsMetadata();
  }

  async getProjectMetadata(projectSlug: string) {
    return await this.projectService.getProjectMetadata(projectSlug);
  }
}
