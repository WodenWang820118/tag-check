import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { FileService } from '../../os/file/file.service';
import { FilePathService } from '../../os/path/file-path/file-path.service';

@Injectable()
export class ProjectSpecService {
  constructor(
    private fileService: FileService,
    private filePathService: FilePathService
  ) {}

  async getProjectSpecs(projectSlug: string) {
    const allSpecs = await this.fileService.readJsonFile(
      await this.filePathService.getProjectConfigFilePath(projectSlug)
    );

    return {
      projectSlug: projectSlug,
      specs: allSpecs,
    };
  }

  async getSpec(projectSlug: string, eventName: string) {
    const allSpecs = await this.fileService.readJsonFile(
      await this.filePathService.getProjectConfigFilePath(projectSlug)
    );

    const spec = allSpecs.find(
      (spec: { event: string }) => spec.event === eventName
    );
    return spec;
  }

  async addSpec(
    projectSlug: string,
    spec: { event: string; [key: string]: any }
  ) {
    try {
      // check if the spec already exists
      const specs = await this.fileService.readJsonFile(
        await this.filePathService.getProjectConfigFilePath(projectSlug)
      );

      const existingSpec = specs.find(
        (s: { event: string }) => s.event === spec.data.event
      );

      if (existingSpec) {
        return {
          projectSlug: projectSlug,
          specs: specs,
        };
      }

      const allSpecs = [...specs, spec.data];

      this.fileService.writeJsonFile(
        await this.filePathService.getProjectConfigFilePath(projectSlug),
        allSpecs
      );

      return {
        projectSlug: projectSlug,
        specs: allSpecs,
      };
    } catch (error) {
      Logger.error(error.message, 'WaiterSpecService.addSpec');
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateSpec(
    projectSlug: string,
    eventName: string,
    spec: { event: string; [key: string]: any }
  ) {
    try {
      const allSpecs = await this.fileService.readJsonFile(
        await this.filePathService.getProjectConfigFilePath(projectSlug)
      );

      const updatedSpecs = allSpecs.map((s: { event: string }) => {
        if (s.event === eventName) {
          return spec.data;
        }
        return s;
      });

      await this.fileService.writeJsonFile(
        await this.filePathService.getProjectConfigFilePath(projectSlug),
        updatedSpecs
      );

      return {
        projectSlug: projectSlug,
        specs: updatedSpecs,
      };
    } catch (error) {
      Logger.error(error.message, 'WaiterSpecService.updateSpec');
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
