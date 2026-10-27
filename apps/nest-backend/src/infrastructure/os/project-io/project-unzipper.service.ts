import { Injectable, Logger } from '@nestjs/common';
import {
  createReadStream,
  existsSync,
  mkdtempSync,
  readdirSync,
  renameSync,
  rmSync,
  mkdirSync,
  ReadStream
} from 'fs';
import { Writable } from 'stream';
import * as unzipper from 'unzipper';
import { join } from 'path';

/**
 * A slug that names exactly one folder: not empty, not `.` or `..`, and
 * without path separators or characters Windows rejects in a file name.
 */
// oxlint-disable-next-line no-control-regex -- control characters are what it rejects
const SAFE_FOLDER_SLUG = /^(?!\.{1,2}$)[^<>:"/\\|?*\x00-\x1f]+$/;

export function isProjectFolderSlug(value: unknown): value is string {
  return typeof value === 'string' && SAFE_FOLDER_SLUG.test(value);
}

export interface ProjectUnzipOptions {
  overwriteExisting?: boolean;
  validateStaged?: (stagingDir: string) => string;
  afterReplace?: () => Promise<void>;
}

/**
 * Extracts a project zip into the projects folder. The zip is extracted to
 * a staging folder first, so a failed extraction leaves existing projects
 * untouched. Replacement keeps the previous folder until its callback
 * succeeds, and restores it if publication or the callback fails.
 */
@Injectable()
export class ProjectUnzipper {
  private readonly logger = new Logger(ProjectUnzipper.name);
  private publication: Promise<void> = Promise.resolve();

  /**
   * @param providedSlug - The slug to use when the zip has no fixture.
   * @param options.overwriteExisting - Replace an existing folder of the
   * same slug (the default) rather than suffixing the slug.
   * @param options.validateStaged - Validate extracted data before touching
   * the destination and return its canonical slug.
   * @param options.afterReplace - Commit associated data while the previous
   * folder is still available for rollback.
   * @returns The slug of the folder the project was extracted to.
   * @throws When extraction, validation, replacement or its callback fails.
   */
  async unzip(
    providedSlug: string,
    zipFilePath: string,
    outputFolderPath: string,
    options: ProjectUnzipOptions = {}
  ): Promise<string> {
    let stagingDir: string | null = null;
    let readStream: ReadStream | null = null;
    let extractStream: Writable | null = null;
    try {
      stagingDir = this.createStagingDir(outputFolderPath);
      this.logger.log(
        `Unzipping project (initial slug='${providedSlug}') to staging directory ${stagingDir}`
      );
      const rs = createReadStream(zipFilePath);
      const es = unzipper.Extract({ path: stagingDir });
      readStream = rs;
      extractStream = es as unknown as Writable;

      await new Promise<void>((resolve, reject) => {
        rs.pipe(es)
          .on('close', () => resolve())
          .on('error', (err: unknown) =>
            reject(this.wrapErr('Extraction error', err))
          );
        rs.on('error', (err: unknown) =>
          reject(this.wrapErr('Read stream error', err))
        );
      });

      const baseSlug = options.validateStaged
        ? options.validateStaged(stagingDir)
        : (this.inferSlugFromFixture(stagingDir) ?? providedSlug);
      if (!isProjectFolderSlug(baseSlug)) {
        throw new Error(`Invalid project slug '${baseSlug}' in the zip`);
      }
      // Keep publication and its callback together so an overlapping failure
      // cannot restore a backup over another import.
      const previous = this.publication;
      let release: () => void = () => undefined;
      this.publication = new Promise<void>((resolve) => {
        release = resolve;
      });
      await previous;
      try {
        return await this.finalizeExtraction(
          baseSlug,
          stagingDir,
          outputFolderPath,
          options
        );
      } finally {
        release();
      }
    } finally {
      if (readStream) {
        try {
          readStream.destroy();
        } catch {
          /* ignore */
        }
      }
      if (extractStream) extractStream.end?.();
      if (stagingDir) {
        try {
          rmSync(stagingDir, { recursive: true, force: true });
        } catch {
          /* ignore */
        }
      }
    }
  }

  private async finalizeExtraction(
    baseSlug: string,
    stagingDir: string,
    outputFolderPath: string,
    options: ProjectUnzipOptions
  ): Promise<string> {
    const { overwriteExisting = true, afterReplace } = options;
    const finalSlug = overwriteExisting
      ? baseSlug
      : this.ensureUniqueFolderSlug(baseSlug, outputFolderPath);
    const finalPath = join(outputFolderPath, finalSlug);
    let backupDir: string | undefined;
    let backupPath: string | undefined;
    let published = false;
    try {
      if (existsSync(finalPath)) {
        if (!overwriteExisting)
          throw new Error(`Target folder already exists: ${finalPath}`);
        backupDir = mkdtempSync(join(outputFolderPath, '_import_backup_'));
        const previousPath = join(backupDir, 'project');
        renameSync(finalPath, previousPath);
        backupPath = previousPath;
      }
      // Staging and backup live under the output root, so rename is on the
      // same filesystem. A failed rename must not fall back to merging files.
      renameSync(stagingDir, finalPath);
      published = true;
      await afterReplace?.();
    } catch (error) {
      try {
        if (published) renameSync(finalPath, stagingDir);
        if (backupPath) renameSync(backupPath, finalPath);
      } catch (restoreError) {
        throw new AggregateError(
          [error, restoreError],
          `Failed to restore project '${finalSlug}'; previous files remain at '${backupPath}'`
        );
      }
      if (backupDir) this.cleanupDirectory(backupDir);
      throw error;
    }
    // The callback has committed. Cleanup failure must not roll back files
    // after the database has already accepted the new project.
    if (backupDir) this.cleanupDirectory(backupDir);
    this.logger.log(
      `Extraction complete. baseSlug='${baseSlug}' finalSlug='${finalSlug}' path='${finalPath}' overwrite=${overwriteExisting}`
    );
    return finalSlug;
  }

  private cleanupDirectory(path: string) {
    try {
      rmSync(path, { recursive: true, force: true });
    } catch (error) {
      this.logger.warn(`Failed to clean up '${path}': ${String(error)}`);
    }
  }

  private wrapErr(prefix: string, err: unknown) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err);
    return new Error(`${prefix}: ${msg}`);
  }

  private createStagingDir(root: string): string {
    if (!existsSync(root)) mkdirSync(root, { recursive: true });
    try {
      const prefix = join(root, '_import_tmp_');
      return mkdtempSync(prefix);
    } catch {
      const manual = join(
        root,
        `_import_tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      );
      mkdirSync(manual, { recursive: true });
      return manual;
    }
  }

  private inferSlugFromFixture(stagingDir: string): string | null {
    try {
      const entries = readdirSync(stagingDir);
      const fixtures = entries.filter((e) => e.endsWith('.fixture.json'));
      if (!fixtures.length) return null;
      fixtures.sort((a, b) => a.localeCompare(b));
      return fixtures[0].replace(/\.fixture\.json$/, '');
    } catch {
      return null;
    }
  }

  private ensureUniqueFolderSlug(
    baseSlug: string,
    outputFolderPath: string
  ): string {
    // Start suffixing at -1 for first conflict (previous implementation started at -2)
    let candidate = baseSlug;
    let counter = 1;
    while (existsSync(join(outputFolderPath, candidate))) {
      candidate = `${baseSlug}-${counter}`;
      counter++;
      if (counter > 1000) {
        candidate = `${baseSlug}-${Date.now()}`;
        break;
      }
    }
    return candidate;
  }
}
