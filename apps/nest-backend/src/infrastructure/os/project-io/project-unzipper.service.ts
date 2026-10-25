import { Injectable, Logger } from '@nestjs/common';
import {
  createReadStream,
  existsSync,
  mkdtempSync,
  readdirSync,
  renameSync,
  rmSync,
  mkdirSync,
  ReadStream,
  copyFileSync,
  Dirent
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

/**
 * Extracts a project zip into the projects folder. The zip is extracted to
 * a staging folder first, so a failed extraction leaves existing projects
 * untouched; the staging folder is then moved to `<output>/<slug>`.
 */
@Injectable()
export class ProjectUnzipper {
  private readonly logger = new Logger(ProjectUnzipper.name);

  /**
   * @param providedSlug - The slug to use when the zip has no fixture.
   * @param options.overwriteExisting - Replace an existing folder of the
   * same slug (the default) rather than suffixing the slug.
   * @returns The slug of the folder the project was extracted to.
   * @throws When extraction fails, or when the resolved slug does not name
   * a single folder, before anything outside the staging folder is touched.
   */
  async unzip(
    providedSlug: string,
    zipFilePath: string,
    outputFolderPath: string,
    options: { overwriteExisting?: boolean } = {}
  ): Promise<string> {
    const { overwriteExisting = true } = options;
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

      return this.finalizeExtraction({
        providedSlug,
        stagingDir,
        outputFolderPath,
        overwriteExisting
      });
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

  private finalizeExtraction(args: {
    providedSlug: string;
    stagingDir: string;
    outputFolderPath: string;
    overwriteExisting: boolean;
  }): string {
    const { providedSlug, stagingDir, outputFolderPath, overwriteExisting } =
      args;
    const inferredSlug = this.inferSlugFromFixture(stagingDir);
    const baseSlug = inferredSlug || providedSlug;
    // The slug comes from a file name in the zip or from the upload's name.
    // An empty one, '.' or '..' would make the overwrite below delete the
    // projects folder itself or its parent.
    if (!SAFE_FOLDER_SLUG.test(baseSlug)) {
      throw new Error(`Invalid project slug '${baseSlug}' in the zip`);
    }
    const finalSlug = overwriteExisting
      ? baseSlug
      : this.ensureUniqueFolderSlug(baseSlug, outputFolderPath);
    const finalPath = join(outputFolderPath, finalSlug);
    this.prepareFinalDirectory(finalPath, finalSlug, overwriteExisting);
    this.moveOrCopy(stagingDir, finalPath);
    this.logger.log(
      `Extraction complete. baseSlug='${baseSlug}' finalSlug='${finalSlug}' path='${finalPath}' overwrite=${overwriteExisting}`
    );
    return finalSlug;
  }

  private prepareFinalDirectory(
    finalPath: string,
    finalSlug: string,
    overwriteExisting: boolean
  ) {
    if (existsSync(finalPath)) {
      if (overwriteExisting) {
        this.logger.log(
          `Overwriting existing folder for slug='${finalSlug}' at path='${finalPath}'`
        );
        try {
          rmSync(finalPath, { recursive: true, force: true });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          this.logger.warn(
            `Failed initial removal of existing folder (${msg}); attempting continue.`
          );
        }
      } else {
        throw new Error(
          `Unexpected: target folder already exists: ${finalPath}`
        );
      }
    }
  }

  private moveOrCopy(stagingDir: string, finalPath: string) {
    try {
      renameSync(stagingDir, finalPath);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(
        `Primary rename failed (${msg}); attempting manual copy fallback.`
      );
      this.copyDirRecursive(stagingDir, finalPath);
      try {
        rmSync(stagingDir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
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

  private copyDirRecursive(src: string, dest: string) {
    if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
    const entries: Dirent[] = readdirSync(src, {
      withFileTypes: true
    }) as unknown as Dirent[];
    for (const entry of entries) {
      const srcPath = join(src, entry.name);
      const destPath = join(dest, entry.name);
      if (entry.isDirectory()) {
        this.copyDirRecursive(srcPath, destPath);
      } else if (entry.isFile()) {
        copyFileSync(srcPath, destPath);
      }
    }
  }
}
