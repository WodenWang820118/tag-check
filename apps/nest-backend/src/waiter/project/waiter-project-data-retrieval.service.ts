import { Injectable } from '@nestjs/common';
import { ProjectService } from '../../os/project/project.service';
import { FileService } from '../../os/file/file.service';
import { SpecParser } from '@datalayer-checker/spec-parser';
import { ImageService } from '../../os/image/image.service';

@Injectable()
export class WaiterProjectDataRetrievalService {
  specParser: SpecParser = new SpecParser();

  constructor(
    private fileService: FileService,
    private projectService: ProjectService,
    private imageService: ImageService
  ) {}

  async getProjectsMetadata() {
    return await this.projectService.getProjectsMetadata();
  }

  async getProjectMetadata(projectSlug: string) {
    return await this.projectService.getProjectMetadata(projectSlug);
  }

  async readImage(projectName: string, testName: string) {
    return await this.imageService.readImage(projectName, testName);
  }
}
