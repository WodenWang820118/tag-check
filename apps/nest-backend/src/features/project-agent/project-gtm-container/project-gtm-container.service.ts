import { Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { GTMConfiguration, parseGtmContainerExport } from '@utils';
import { FolderPathService } from '../../../infrastructure/os/path/folder-path/folder-path.service';
import { FileService } from '../../../infrastructure/os/file/file.service';

/** File name of a project's imported Tag Manager container, in its config folder. */
export const GTM_CONTAINER_FILE_NAME = 'gtm-container.json';

/**
 * Saves and reads the GTM container a project imported, in its config
 * folder.
 */
@Injectable()
export class ProjectGtmContainerService {
  private readonly logger = new Logger(ProjectGtmContainerService.name);

  constructor(
    private readonly folderPathService: FolderPathService,
    private readonly fileService: FileService
  ) {}

  async save(projectSlug: string, container: GTMConfiguration): Promise<void> {
    this.fileService.writeJsonFile(await this.getPath(projectSlug), container);
  }

  /** The project's saved container, or null when none was imported or it cannot be read. */
  async read(projectSlug: string): Promise<GTMConfiguration | null> {
    try {
      const { container, error } = parseGtmContainerExport(
        this.fileService.readJsonFile<unknown>(await this.getPath(projectSlug))
      );
      if (error) {
        this.logger.warn(`Saved GTM container for ${projectSlug}: ${error}`);
      }
      return container ?? null;
    } catch {
      return null;
    }
  }

  private async getPath(projectSlug: string): Promise<string> {
    return join(
      await this.folderPathService.getProjectConfigFolderPath(projectSlug),
      GTM_CONTAINER_FILE_NAME
    );
  }
}
