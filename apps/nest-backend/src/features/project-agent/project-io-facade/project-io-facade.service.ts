import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  StreamableFile
} from '@nestjs/common';
import { ProjectIoService } from '../../../infrastructure/os/project-io/project-io.service';
import { JsonProjectExportService } from '../../../infrastructure/data-export/json/export/json-project-export.service';
import { JsonProjectImportService } from '../../../infrastructure/data-export/json/import/json-project-import.service';
import {
  writeFileSync,
  readFileSync,
  readdirSync,
  existsSync,
  mkdirSync,
  createReadStream
} from 'fs';
import { FolderPathService } from '../../../infrastructure/os/path/folder-path/folder-path.service';
import { basename, join } from 'path';
import { FolderService } from '../../../infrastructure/os/folder/folder.service';

/**
 * Exports a project as a zip of its folder plus a JSON fixture of its
 * database rows, and imports such a zip back: the folder on disk and the
 * rows in the database.
 */
@Injectable()
export class ProjectIoFacadeService {
  private readonly logger = new Logger(ProjectIoFacadeService.name);
  constructor(
    private readonly projectIoService: ProjectIoService,
    private readonly folderPathService: FolderPathService,
    private readonly folderService: FolderService,
    private readonly jsonExportService: JsonProjectExportService,
    private readonly jsonImportService: JsonProjectImportService
  ) {}

  /**
   * Zips the project's folder with `<slug>.fixture.json` added, and streams
   * the zip. The staging folder is removed once the stream closes.
   *
   * @throws BadRequestException without a slug; whatever the fixture export
   * or the compression throws.
   */
  async exportProject(projectSlug: string) {
    if (!projectSlug) {
      throw new BadRequestException('Project slug is required');
    }
    const projectPath =
      await this.folderPathService.getProjectFolderPath(projectSlug);
    const tempFolder = await this.createTempFolder();
    const projectZipPath = join(tempFolder, `${projectSlug}.zip`);

    // The fixture is staged next to the zip and added to it as an extra file.
    const fixturePath = join(tempFolder, `${projectSlug}.fixture.json`);
    try {
      const jsonEnvelope =
        await this.jsonExportService.exportProject(projectSlug);
      writeFileSync(
        fixturePath,
        JSON.stringify(jsonEnvelope, null, 2),
        'utf-8'
      );
    } catch (e) {
      this.logger.error(
        `Failed to generate JSON export for ${projectSlug}: ${(e as Error).message}`
      );
      throw e;
    }

    await this.projectIoService.compressProject(
      projectPath,
      projectZipPath,
      projectSlug,
      [{ path: fixturePath, name: `${projectSlug}.fixture.json` }]
    );
    if (!existsSync(projectZipPath)) {
      // compressProject resolves once the zip is closed; guard anyway so
      // that the stream below does not fail on a missing file.
      this.logger.warn(`Zip not found after compression at ${projectZipPath}`);
      writeFileSync(projectZipPath, '');
    }
    const fileStream = createReadStream(projectZipPath);
    fileStream.on('error', (err) => {
      this.logger.error(`Stream error reading zip: ${err.message}`);
    });
    fileStream.on('close', () => {
      this.cleanupTempFolder(tempFolder);
    });
    return new StreamableFile(fileStream);
  }

  /**
   * Extracts the zip into the projects folder, then imports its fixture
   * into the database. A zip without a fixture (from before fixtures were
   * exported) only restores the folder.
   *
   * @returns The slug of the extracted project folder.
   * @throws BadRequestException when the fixture is not a valid export;
   * InternalServerErrorException when writing its rows fails. The rows are
   * written in one transaction, so a failed import writes none, but the
   * extracted folder stays.
   */
  async importProject(
    projectSlug: string,
    zipFilePath: string,
    outputFolderPath: string
  ): Promise<string> {
    // unzipProject resolves the final folder slug from the fixture name.
    const finalSlug = await this.projectIoService.unzipProject(
      projectSlug,
      zipFilePath,
      outputFolderPath
    );

    const rootProjectFolder =
      await this.folderPathService.getRootProjectFolderPath();
    const projectFolder = join(rootProjectFolder, finalSlug);
    const fixturePath = this.findFixture(projectFolder);
    if (!fixturePath) {
      this.logger.warn(
        `No JSON fixture found in project folder ${projectFolder}; skipping data import.`
      );
      return finalSlug;
    }
    this.logger.log(
      `Using fixture file '${basename(fixturePath)}' for project import (extracted folder='${finalSlug}')`
    );
    await this.importFixture(fixturePath);
    this.logger.log(`Imported JSON fixture for project ${finalSlug}`);
    return finalSlug;
  }

  /** Deletes the project's folder; the caller deletes its rows. */
  async deleteProject(projectSlug: string) {
    this.folderService.deleteFolder(
      await this.folderPathService.getProjectFolderPath(projectSlug)
    );
  }

  /**
   * The project folder's `*.fixture.json`. The folder slug may differ from
   * the fixture's, so any name is accepted; with several, the first in
   * alphabetical order wins.
   */
  private findFixture(projectFolder: string): string | null {
    let fixtures: string[];
    try {
      fixtures = readdirSync(projectFolder)
        .filter((entry) => entry.endsWith('.fixture.json'))
        .sort((a, b) => a.localeCompare(b));
    } catch (err) {
      this.logger.error(
        `Failed scanning for fixture in ${projectFolder}: ${(err as Error).message}`
      );
      return null;
    }
    if (fixtures.length > 1) {
      this.logger.warn(
        `Multiple fixture files found in ${projectFolder}; using '${fixtures[0]}'`
      );
    }
    return fixtures.length ? join(projectFolder, fixtures[0]) : null;
  }

  private async importFixture(fixturePath: string): Promise<void> {
    let payload: unknown;
    try {
      payload = JSON.parse(readFileSync(fixturePath, 'utf-8'));
      this.jsonImportService.validate(payload);
    } catch (e) {
      this.logger.error(
        `Invalid JSON fixture at ${fixturePath}: ${(e as Error).message}`
      );
      throw new BadRequestException(
        `The project's data file is not a valid export: ${(e as Error).message}`
      );
    }
    try {
      await this.jsonImportService.importProject(payload);
    } catch (e) {
      this.logger.error(
        `Failed to import JSON fixture at ${fixturePath}: ${(e as Error).message}`
      );
      throw new InternalServerErrorException(
        "Failed to import the project's data"
      );
    }
  }

  private async createTempFolder(): Promise<string> {
    const projectRootFolderPath =
      await this.folderPathService.getRootProjectFolderPath();
    const tempFolder = join(projectRootFolderPath, 'temp');
    mkdirSync(tempFolder, { recursive: true });
    return tempFolder;
  }

  private cleanupTempFolder(tempFolder: string) {
    try {
      this.folderService.deleteFolder(tempFolder);
    } catch (error) {
      this.logger.error(`Error cleaning up temp folder`, error);
    }
  }
}
