import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ProjectCompressor } from './project-compressor.service';
import { ProjectUnzipper } from './project-unzipper.service';

/** Zips a project folder for export and extracts an imported zip. */
@Injectable()
export class ProjectIoService {
  private readonly logger = new Logger(ProjectIoService.name);
  constructor(
    private readonly compressor: ProjectCompressor,
    private readonly unzipper: ProjectUnzipper
  ) {}

  /**
   * Writes the project folder, plus `extraFiles` at the zip's root, to
   * `outputPath`.
   *
   * @throws HttpException 500 when compression fails.
   */
  async compressProject(
    projectFolderPath: string,
    outputPath: string,
    projectSlug: string,
    extraFiles: { path: string; name?: string }[] = []
  ): Promise<void> {
    try {
      await this.compressor.compress(
        projectFolderPath,
        outputPath,
        projectSlug,
        extraFiles
      );
    } catch (error) {
      throw new HttpException(
        {
          message: 'Failed to compress project',
          error: error instanceof Error ? error.message : String(error)
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Extracts the zip into `<outputFolderPath>/<slug>`; see ProjectUnzipper.
   *
   * @returns The slug of the extracted project folder.
   * @throws HttpException 500 when extraction fails.
   */
  async unzipProject(
    providedSlug: string,
    zipFilePath: string,
    outputFolderPath: string,
    options: { overwriteExisting?: boolean } = {}
  ): Promise<string> {
    try {
      return await this.unzipper.unzip(
        providedSlug,
        zipFilePath,
        outputFolderPath,
        options
      );
    } catch (error) {
      this.logger.error(
        `Failed to unzip project '${providedSlug}': ${error instanceof Error ? error.message : String(error)}`
      );
      throw new HttpException(
        'Failed to unzip project',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
