import { DatabaseIoService } from './../database-io/database-io.service';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  accessSync,
  constants,
  createReadStream,
  createWriteStream,
  unlinkSync
} from 'fs';
import * as unzipper from 'unzipper';
import archiver from 'archiver';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

@Injectable()
export class ProjectIoService {
  private readonly logger = new Logger(ProjectIoService.name);
  constructor(private readonly databaseIoService: DatabaseIoService) {}

  async compressProject(
    projectFolderPath: string,
    outputPath: string,
    projectSlug: string
  ): Promise<void> {
    this.logger.log(
      `Compressing project at ${projectFolderPath} to ${outputPath}`
    );
    const output = createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    // Create a temporary file for the SQL dump
    const tempDir = tmpdir();
    const sqlDumpPath = join(tempDir, `${projectSlug}_${randomUUID()}.sql`);

    try {
      // Generate SQL dump for the project
      await this.databaseIoService.dumpProjectDatabase(
        projectSlug,
        sqlDumpPath
      );

      // Set up archive
      archive.pipe(output);

      // Add project directory
      archive.directory(projectFolderPath, false);

      // Add SQL dump file
      archive.file(sqlDumpPath, { name: 'database_dump.sql' });

      // Finalize the archive
      await archive.finalize();

      // Clean up the temporary SQL file
      unlinkSync(sqlDumpPath);
    } catch (error) {
      // Clean up if there was an error
      try {
        if (await this.fileExists(sqlDumpPath)) {
          unlinkSync(sqlDumpPath);
        }
      } catch (cleanupError) {
        this.logger.error('Error during cleanup', cleanupError);
      }

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
    projectSlug: string,
    zipFilePath: string,
    outputFolderPath: string
  ): Promise<void> {
    const outputPath = `${outputFolderPath}/${projectSlug}`;
    let readStream: any = null;
    let extractStream: any = null;

    try {
      // Create streams
      this.logger.log(`Unzipping project ${projectSlug} to ${outputPath}`);
      this.logger.log(`Reading ZIP file from ${zipFilePath}`);
      readStream = createReadStream(zipFilePath);
      extractStream = unzipper.Extract({ path: outputPath });

      // Extract the ZIP file
      await new Promise<void>((resolve, reject) => {
        readStream
          .pipe(extractStream)
          .on('close', () => {
            resolve();
          })
          .on('error', (err: { message: any }) => {
            // Create a new error with just the message to avoid circular references
            const errorMessage =
              err instanceof Error ? err.message : JSON.stringify(err, null, 2);
            reject(new Error(`Extraction error: ${errorMessage}`));
          });

        readStream.on('error', (err: { message: any }) => {
          // Create a new error with just the message to avoid circular references
          const errorMessage =
            err instanceof Error ? err.message : JSON.stringify(err, null, 2);
          reject(new Error(`Read stream error: ${errorMessage}`));
        });
      });

      // Import the database from the SQL dump file
      const sqlDumpPath = join(outputPath, 'database_dump.sql');

      // Check if the SQL dump file exists
      try {
        if (await this.fileExists(sqlDumpPath)) {
          this.logger.log(`Importing database from ${sqlDumpPath}`);
          await this.databaseIoService.importProjectDatabase(sqlDumpPath);
          unlinkSync(sqlDumpPath);
          this.logger.log('Database import completed successfully');
        } else {
          this.logger.warn(`No database dump file found at ${sqlDumpPath}`);
          throw new HttpException(
            'No database dump file found',
            HttpStatus.NOT_FOUND
          );
        }
      } catch (importError) {
        // Create a new error with just the message to avoid circular references
        const errorMessage =
          importError instanceof Error
            ? importError.message
            : String(importError);

        this.logger.error(`Failed to import database: ${errorMessage}`);
        throw new HttpException(
          'Failed to import project database',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    } catch (error) {
      // Create a new error with just the message to avoid circular references
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Failed to unzip project ${projectSlug}: ${errorMessage}`
      );
      throw new HttpException(
        'Failed to unzip project',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    } finally {
      // Ensure streams are properly closed
      if (readStream) {
        readStream.destroy();
      }
      if (extractStream) {
        extractStream.end();
      }
    }
  }

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
}
