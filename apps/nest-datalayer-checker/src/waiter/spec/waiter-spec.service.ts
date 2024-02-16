import { Injectable } from '@nestjs/common';
import { FileService } from '../../os/file/file.service';
import { FilePathService } from '../../os/path/file-path/file-path.service';

@Injectable()
export class WaiterSpecService {
  constructor(
    private fileService: FileService,
    private filePathService: FilePathService
  ) {}

  async getSpecs(projectSlug: string) {
    return await this.fileService.readJsonFile(
      await this.filePathService.getProjectConfigFilePath(projectSlug)
    );
  }

  async getSpec(projectSlug: string, eventName: string) {
    const allSpecs = await this.fileService.readJsonFile(
      await this.filePathService.getProjectConfigFilePath(projectSlug)
    );
    const spec = allSpecs.find((spec) => spec.event === eventName);
    return {
      specs: [spec],
    };
  }
}
