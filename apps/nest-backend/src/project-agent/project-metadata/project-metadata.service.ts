/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { ProjectService } from '../../infrastructure/os/project/project.service';

@Injectable()
export class ProjectMetadataService {
  constructor(private readonly projectService: ProjectService) {}

  async getProjectsMetadata() {
    return await this.projectService.getProjectsMetadata();
  }

  async getProjectMetadata(projectSlug: string) {
    return await this.projectService.getProjectMetadata(projectSlug);
  }
}
