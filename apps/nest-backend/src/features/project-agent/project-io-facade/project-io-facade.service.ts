import {
  BadRequestException,
  Injectable,
  Logger,
  StreamableFile
} from '@nestjs/common';
import { ProjectIoService } from '../../../infrastructure/os/project-io/project-io.service';
import { JsonProjectExportService } from '../../../infrastructure/data-export/json/export/json-project-export.service';
import { JsonProjectImportService } from '../../../infrastructure/data-export/json/import/json-project-import.service';
import {
  writeFileSync,
  readFileSync,
  existsSync,
  mkdirSync,
  createReadStream
} from 'fs';
import { FolderPathService } from '../../../infrastructure/os/path/folder-path/folder-path.service';
import { join } from 'path';
import { FolderService } from '../../../infrastructure/os/folder/folder.service';

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

  async exportProject(projectSlug: string) {
    if (!projectSlug) {
      throw new BadRequestException('Project slug is required');
    }
    const projectPath =
      await this.folderPathService.getProjectFolderPath(projectSlug);
    const tempFolder = await this.createTempFolder();
    const projectZipPath = join(tempFolder, `${projectSlug}.zip`);

    // Generate JSON fixture and stage it alongside project contents before compression
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
      // Should not happen because compressProject waits for close, but guard anyway
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

  async importProject(
    projectSlug: string,
    zipFilePath: string,
    outputFolderPath: string
  ): Promise<string> {
    // unzipProject now already performs staging, fixture-based slug inference and uniqueness resolution.
    const finalSlug = await this.projectIoService.unzipProject(
      projectSlug,
      zipFilePath,
      outputFolderPath
    );

    // Look for any single *.fixture.json file inside the final extracted project folder.
    // This avoids mismatch when the folder slug was suffixed but the exported fixture retained original slug.
    try {
      const rootProjectFolder =
        await this.folderPathService.getRootProjectFolderPath();
      const projectFolder = join(rootProjectFolder, finalSlug);
      let fixturePath: string | null = null;
      try {
        const entries = (await import('fs')).readdirSync(projectFolder);
        const fixtures = entries.filter((e) => e.endsWith('.fixture.json'));
        if (fixtures.length === 1) {
          fixturePath = join(projectFolder, fixtures[0]);
        } else if (fixtures.length > 1) {
          // deterministic choice: pick alphabetically first; log warning
          fixtures.sort((a, b) => a.localeCompare(b));
          fixturePath = join(projectFolder, fixtures[0]);
          this.logger.warn(
            `Multiple fixture files found in ${projectFolder}; using '${fixtures[0]}'`
          );
        }
      } catch (err) {
        this.logger.error(
          `Failed scanning for fixture in ${projectFolder}: ${(err as Error).message}`
        );
      }
      if (!fixturePath || !existsSync(fixturePath)) {
        this.logger.warn(
          `No JSON fixture found in project folder ${projectFolder}; skipping data import.`
        );
        return finalSlug;
      }
      this.logger.log(
        `Using fixture file '${fixturePath.split(/[/\\]/).pop()}' for project import (extracted folder='${finalSlug}')`
      );
      await this.tryImportFixture(fixturePath, finalSlug);
    } catch (e) {
      this.logger.error(
        `Error during JSON fixture import for slug '${projectSlug}': ${(e as Error).message}`
      );
    }
    return finalSlug;
  }

  async deleteProject(projectSlug: string) {
    this.folderService.deleteFolder(
      await this.folderPathService.getProjectFolderPath(projectSlug)
    );
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

  private inferSlugFromFixturePath(fixturePath: string): string {
    const fileName = fixturePath.split(/[/\\]/).pop() ?? '';
    return fileName.replace(/\.fixture\.json$/, '');
  }

  private async tryImportFixture(
    fixturePath: string,
    finalSlug: string
  ): Promise<void> {
    try {
      const raw = readFileSync(fixturePath, 'utf-8');
      const parsed = JSON.parse(raw);
      await this.jsonImportService.importProject(parsed);
      this.logger.log(`Imported JSON fixture for project ${finalSlug}`);
    } catch (e) {
      this.logger.error(
        `Failed to import JSON fixture at ${fixturePath}: ${(e as Error).message}`
      );
    }
  }
}
