/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger, NotAcceptableException } from '@nestjs/common';
import { FileService } from '../../../infrastructure/os/file/file.service';
import { FilePathService } from '../../../infrastructure/os/path/file-path/file-path.service';
import { Spec } from '@utils';

@Injectable()
export class ProjectSpecService {
  private readonly logger = new Logger(ProjectSpecService.name);
  constructor(
    private readonly fileService: FileService,
    private readonly filePathService: FilePathService
  ) {}

  async getProjectSpecs(
    projectSlug: string
  ): Promise<{ projectSlug: string; specs: Spec[] }> {
    const specs = await this.readSpecsFile(projectSlug);
    return { projectSlug, specs };
  }

  async getSpec(
    projectSlug: string,
    eventName: string
  ): Promise<Spec | undefined> {
    const specs = await this.readSpecsFile(projectSlug);
    return specs.find((spec) => spec.event === eventName);
  }

  async addSpec(
    projectSlug: string,
    spec: Spec
  ): Promise<{ projectSlug: string; specs: Spec[] }> {
    const specs = await this.readSpecsFile(projectSlug);
    const existingSpecIndex = specs.findIndex((s) => s.event === spec.event);

    if (existingSpecIndex !== -1) {
      specs[existingSpecIndex] = spec;
    } else {
      specs.push(spec);
    }

    await this.writeSpecsFile(projectSlug, specs);
    return { projectSlug, specs };
  }

  async updateSpec(
    projectSlug: string,
    eventName: string,
    spec: Spec
  ): Promise<{ projectSlug: string; specs: Spec[] }> {
    const specs = await this.readSpecsFile(projectSlug);
    const updatedSpecs = specs.map((s) => (s.event === eventName ? spec : s));
    await this.writeSpecsFile(projectSlug, updatedSpecs);
    return { projectSlug, specs: updatedSpecs };
  }

  private async readSpecsFile(projectSlug: string): Promise<Spec[]> {
    const filePath =
      await this.filePathService.getProjectConfigFilePath(projectSlug);
    const specs = this.fileService.readJsonFile(filePath);

    if (!Array.isArray(specs)) {
      throw new NotAcceptableException('Invalid configuration file format');
    }

    return specs;
  }

  private async writeSpecsFile(
    projectSlug: string,
    specs: Spec[]
  ): Promise<void> {
    const filePath =
      await this.filePathService.getProjectConfigFilePath(projectSlug);
    this.fileService.writeJsonFile(filePath, specs);
  }
}
