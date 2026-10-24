import { BadRequestException, Injectable } from '@nestjs/common';
import { isAbsolute, join, relative, resolve, sep } from 'path';
import { SysConfigurationRepositoryService } from '../../../../core/repository/sys-configuration/sys-configuration-repository.service';

/**
 * Builds paths under the root projects folder (the `rootProjectPath`
 * configuration): `<root>/<projectSlug>/<folder>[/<file>]`. Slugs and event
 * IDs come from request URLs, so every path is checked to stay inside its
 * project's folder; callers delete and write at these paths.
 */
@Injectable()
export class PathUtilsService {
  constructor(
    private readonly configurationService: SysConfigurationRepositoryService
  ) {}

  /**
   * @returns `<root>/<projectName>/<folderName>/<fileName>`; the file may
   * not exist yet.
   * @throws BadRequestException when the path would leave the project's
   * folder.
   */
  async buildFilePath(
    projectName: string,
    folderName: string,
    fileName: string
  ) {
    const root = await this.configurationService.getRootProjectPath();
    return this.insideProject(root, projectName, folderName, fileName || '');
  }

  /**
   * @returns `<root>/<projectSlug>/<folderName>`; the folder may not exist
   * yet.
   * @throws BadRequestException when the path would leave the project's
   * folder.
   */
  async buildFolderPath(projectSlug: string, folderName: string) {
    const root = await this.configurationService.getRootProjectPath();
    return this.insideProject(root, projectSlug, folderName);
  }

  /**
   * Joins the segments under `<root>/<projectSlug>` after checking that the
   * slug names one folder directly under the root and that the rest does
   * not climb out of it (`..`, an absolute path, or another drive on
   * Windows).
   */
  private insideProject(
    root: string,
    projectSlug: string,
    ...segments: string[]
  ): string {
    const projectFolder = resolve(root, projectSlug);
    const slugPath = relative(resolve(root), projectFolder);
    if (!slugPath || slugPath.includes(sep) || this.climbsOut(slugPath)) {
      throw new BadRequestException(`Invalid project slug '${projectSlug}'`);
    }
    const target = resolve(projectFolder, ...segments);
    if (this.climbsOut(relative(projectFolder, target))) {
      throw new BadRequestException(
        `Invalid path '${segments.join('/')}' in project '${projectSlug}'`
      );
    }
    return join(root, projectSlug, ...segments);
  }

  private climbsOut(relativePath: string): boolean {
    return (
      relativePath === '..' ||
      relativePath.startsWith(`..${sep}`) ||
      isAbsolute(relativePath)
    );
  }
}
