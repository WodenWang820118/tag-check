import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { accessSync, constants } from 'fs';
import { ProjectCompressor } from './project-compressor.service';
import { ProjectUnzipper } from './project-unzipper.service';

@Injectable()
export class ProjectIoService {
  private readonly logger = new Logger(ProjectIoService.name);
  constructor(
    private readonly compressor: ProjectCompressor,
    private readonly unzipper: ProjectUnzipper
  ) {}

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

  // Legacy SQL related utilities kept temporarily (could be removed if unused)

  /**
   * Helper method to check if a file exists
   */
  private fileExists(path: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      try {
        accessSync(path, constants.R_OK);
        resolve(true);
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Parse the provided SQL dump file and extract the project slug from the
   * INSERT statement for the `project` table. Returns undefined if not found.
   */
  // extractProjectSlugFromSqlDump removed with legacy SQL system.

  /**
   * Split a SQL VALUES list by commas, respecting quoted strings.
   */
  private splitSqlValues(valuesRaw: string): string[] {
    const result: string[] = [];
    let current = '';
    let i = 0;
    const len = valuesRaw.length;
    while (i < len) {
      const ch = valuesRaw[i];
      if (ch === "'") {
        const { text, next } = this.readQuoted(valuesRaw, i);
        current += text;
        i = next;
        continue;
      }
      if (ch === ',') {
        result.push(current.trim());
        current = '';
        i++;
        continue;
      }
      current += ch;
      i++;
    }
    if (current.length > 0) result.push(current.trim());
    return result;
  }

  private readQuoted(
    valuesRaw: string,
    startIndex: number
  ): { text: string; next: number } {
    let i = startIndex;
    const len = valuesRaw.length;
    let text = '';
    // Append opening quote
    text += valuesRaw[i];
    i++;
    while (i < len) {
      const ch = valuesRaw[i];
      text += ch;
      if (ch === "'") {
        // doubled single-quote inside string literal
        if (i + 1 < len && valuesRaw[i + 1] === "'") {
          text += "'";
          i += 2;
          continue;
        }
        i++;
        break;
      }
      i++;
    }
    return { text, next: i };
  }
}
