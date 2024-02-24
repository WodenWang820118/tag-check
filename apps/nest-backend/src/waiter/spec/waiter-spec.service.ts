import { HttpException, Injectable, Logger } from '@nestjs/common';
import { FileService } from '../../os/file/file.service';
import { FilePathService } from '../../os/path/file-path/file-path.service';

@Injectable()
export class WaiterSpecService {
  constructor(
    private fileService: FileService,
    private filePathService: FilePathService
  ) {}

  async getSpecs(projectSlug: string) {
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
    return {
      projectSlug: projectSlug,
      specs: [spec],
    };
  }

  async addSpec(projectSlug: string, spec: any) {
    try {
      const allSpecs = [
        ...(await this.fileService.readJsonFile(
          await this.filePathService.getProjectConfigFilePath(projectSlug)
        )),
        spec.data,
      ];

      await this.fileService.writeJsonFile(
        await this.filePathService.getProjectConfigFilePath(projectSlug),
        allSpecs
      );

      return {
        projectSlug: projectSlug,
        specs: allSpecs,
      };
    } catch (error) {
      Logger.error(error.message, 'WaiterSpecService.addSpec');
      throw new HttpException(
        {
          status: 'error',
          message: 'Error adding spec',
        },
        500
      );
    }
  }

  async updateSpec(projectSlug: string, eventName: string, spec: any) {
    try {
      const allSpecs = await this.fileService.readJsonFile(
        await this.filePathService.getProjectConfigFilePath(projectSlug)
      );

      const updatedSpecs = allSpecs.map((s: any) => {
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
      throw new HttpException(
        {
          status: 'error',
          message: 'Error updating spec',
        },
        500
      );
    }
  }
}
