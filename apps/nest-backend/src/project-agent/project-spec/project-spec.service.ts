import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { FileService } from '../../os/file/file.service';
import { FilePathService } from '../../os/path/file-path/file-path.service';
import { Spec } from '@utils';

@Injectable()
export class ProjectSpecService {
  constructor(
    private fileService: FileService,
    private filePathService: FilePathService
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
    try {
      const specs = await this.readSpecsFile(projectSlug);
      const existingSpecIndex = specs.findIndex((s) => s.event === spec.event);

      if (existingSpecIndex !== -1) {
        specs[existingSpecIndex] = spec;
      } else {
        specs.push(spec);
      }

      await this.writeSpecsFile(projectSlug, specs);
      return { projectSlug, specs };
    } catch (error) {
      this.handleError(error, 'addSpec');
    }
  }

  async updateSpec(
    projectSlug: string,
    eventName: string,
    spec: Spec
  ): Promise<{ projectSlug: string; specs: Spec[] }> {
    try {
      const specs = await this.readSpecsFile(projectSlug);
      const updatedSpecs = specs.map((s) => (s.event === eventName ? spec : s));
      await this.writeSpecsFile(projectSlug, updatedSpecs);
      return { projectSlug, specs: updatedSpecs };
    } catch (error) {
      this.handleError(error, 'updateSpec');
    }
  }

  private async readSpecsFile(projectSlug: string): Promise<Spec[]> {
    const filePath = await this.filePathService.getProjectConfigFilePath(
      projectSlug
    );
    const specs = this.fileService.readJsonFile(filePath);

    if (!Array.isArray(specs)) {
      throw new Error('Invalid configuration file format');
    }

    return specs;
  }

  private async writeSpecsFile(
    projectSlug: string,
    specs: Spec[]
  ): Promise<void> {
    const filePath = await this.filePathService.getProjectConfigFilePath(
      projectSlug
    );
    this.fileService.writeJsonFile(filePath, specs);
  }

  private handleError(error: Error, methodName: string): never {
    Logger.error(`${error}`, `${ProjectSpecService.name}.${methodName}`);
    throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
