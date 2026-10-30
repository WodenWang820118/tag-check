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
import type { FixtureEnvelopeV1 } from '../../../infrastructure/data-export/interfaces/fixture-types';
import { isProjectFolderSlug } from '../../../infrastructure/os/project-io/project-unzipper.service';
import {
  writeFileSync,
  readFileSync,
  readdirSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
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
      await this.projectIoService.compressProject(
        projectPath,
        projectZipPath,
        projectSlug,
        [{ path: fixturePath, name: `${projectSlug}.fixture.json` }]
      );
      if (!existsSync(projectZipPath)) {
        throw new Error(`Zip not found after compression at ${projectZipPath}`);
      }
      const fileStream = createReadStream(projectZipPath);
      fileStream.on('error', (err) => {
        this.logger.error(`Stream error reading zip: ${err.message}`);
      });
      fileStream.on('close', () => {
        this.cleanupTempFolder(tempFolder);
      });
      return new StreamableFile(fileStream);
    } catch (error) {
      this.cleanupTempFolder(tempFolder);
      throw error;
    }
  }

  /**
   * Validates the fixture in staging, then replaces the project folder and
   * imports its rows. The previous folder is kept until the row transaction
   * commits and restored on failure. A zip without a fixture only restores
   * the folder using the supplied slug.
   *
   * @returns The slug of the extracted project folder.
   * @throws BadRequestException when the fixture is not a valid export;
   * InternalServerErrorException when writing its rows fails. The rows are
   * written in one transaction, so a failed import changes neither the rows
   * nor the previous folder.
   */
  async importProject(
    projectSlug: string,
    zipFilePath: string,
    outputFolderPath: string
  ): Promise<string> {
    let fixture: FixtureEnvelopeV1 | undefined;
    return this.projectIoService.unzipProject(
      projectSlug,
      zipFilePath,
      outputFolderPath,
      {
        validateStaged: (stagingDir) => {
          const fixturePath = this.findFixture(stagingDir);
          if (!fixturePath) {
            if (!isProjectFolderSlug(projectSlug)) {
              throw new BadRequestException(
                `Invalid project slug '${projectSlug}'`
              );
            }
            return projectSlug;
          }
          fixture = this.validateFixture(fixturePath);
          return fixture.projectSlug;
        },
        afterReplace: async () => {
          if (fixture) await this.importFixture(fixture);
        }
      }
    );
  }

  /** Deletes the project's folder; the caller deletes its rows. */
  async deleteProject(projectSlug: string) {
    this.folderService.deleteFolder(
      await this.folderPathService.getProjectFolderPath(projectSlug)
    );
  }

  /**
   * The staging folder's first `*.fixture.json` in alphabetical order.
   */
  private findFixture(projectFolder: string): string | null {
    const fixtures = readdirSync(projectFolder)
      .filter((entry) => entry.endsWith('.fixture.json'))
      .sort((a, b) => a.localeCompare(b));
    if (fixtures.length > 1) {
      this.logger.warn(
        `Multiple fixture files found in ${projectFolder}; using '${fixtures[0]}'`
      );
    }
    return fixtures.length ? join(projectFolder, fixtures[0]) : null;
  }

  private validateFixture(fixturePath: string): FixtureEnvelopeV1 {
    try {
      const payload: unknown = JSON.parse(readFileSync(fixturePath, 'utf-8'));
      const fixture = this.jsonImportService.validate(payload);
      if (!isProjectFolderSlug(fixture.projectSlug)) {
        throw new Error(`Invalid projectSlug '${fixture.projectSlug}'`);
      }
      if (basename(fixturePath) !== `${fixture.projectSlug}.fixture.json`) {
        throw new Error('Fixture filename does not match projectSlug');
      }
      if (
        typeof fixture.entities !== 'object' ||
        fixture.entities === null ||
        Array.isArray(fixture.entities)
      ) {
        throw new Error('Invalid entities');
      }
      for (const rows of Object.values(fixture.entities)) {
        if (
          !Array.isArray(rows) ||
          rows.some(
            (row) => !row || typeof row !== 'object' || Array.isArray(row)
          )
        ) {
          throw new Error('Invalid entity rows');
        }
      }
      const projects = fixture.entities['ProjectEntity'];
      if (
        projects?.length !== 1 ||
        projects[0]['projectSlug'] !== fixture.projectSlug
      ) {
        throw new Error(
          'ProjectEntity must contain one project matching projectSlug'
        );
      }
      return fixture;
    } catch (e) {
      this.logger.error(
        `Invalid JSON fixture at ${fixturePath}: ${(e as Error).message}`
      );
      throw new BadRequestException(
        `The project's data file is not a valid export: ${(e as Error).message}`
      );
    }
  }

  private async importFixture(fixture: FixtureEnvelopeV1): Promise<void> {
    try {
      await this.jsonImportService.importProject(fixture);
    } catch (e) {
      this.logger.error(
        `Failed to import JSON fixture for ${fixture.projectSlug}: ${(e as Error).message}`
      );
      throw new InternalServerErrorException(
        "Failed to import the project's data"
      );
    }
  }

  private async createTempFolder(): Promise<string> {
    const projectRootFolderPath =
      await this.folderPathService.getRootProjectFolderPath();
    mkdirSync(projectRootFolderPath, { recursive: true });
    return mkdtempSync(join(projectRootFolderPath, '_export_tmp_'));
  }

  private cleanupTempFolder(tempFolder: string) {
    try {
      this.folderService.deleteFolder(tempFolder);
    } catch (error) {
      this.logger.error(`Error cleaning up temp folder`, error);
    }
  }
}
