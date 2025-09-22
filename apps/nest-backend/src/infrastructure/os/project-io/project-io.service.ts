import { DatabaseIoService } from './../database-io/database-io.service';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  accessSync,
  constants,
  createReadStream,
  createWriteStream,
  unlinkSync,
  readFileSync,
  ReadStream
} from 'fs';
import { Writable } from 'stream';
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
  ): Promise<string> {
    const outputPath = `${outputFolderPath}/${projectSlug}`;
    let readStream: ReadStream | null = null;
    let extractStream: Writable | null = null;

    try {
      // Create streams
      this.logger.log(`Unzipping project ${projectSlug} to ${outputPath}`);
      this.logger.log(`Reading ZIP file from ${zipFilePath}`);
      const rs = createReadStream(zipFilePath);
      const es = unzipper.Extract({ path: outputPath });
      readStream = rs;
      extractStream = es as unknown as Writable;

      // Extract the ZIP file
      await new Promise<void>((resolve, reject) => {
        rs.pipe(es)
          .on('close', () => {
            resolve();
          })
          .on('error', (err: unknown) => {
            // Create a new error with just the message to avoid circular references
            const errorMessage =
              err instanceof Error ? err.message : JSON.stringify(err, null, 2);
            reject(new Error(`Extraction error: ${errorMessage}`));
          });

        rs.on('error', (err: unknown) => {
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

          // After import, extract the project slug from the dump for return
          const importedProjectSlug =
            this.extractProjectSlugFromSqlDump(sqlDumpPath);

          // Clean up the SQL file
          unlinkSync(sqlDumpPath);
          this.logger.log('Database import completed successfully');

          return importedProjectSlug ?? projectSlug;
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
      if (readStream) readStream.destroy();
      if (extractStream) {
        const ws: Writable = extractStream;
        ws.end();
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

  /**
   * Parse the provided SQL dump file and extract the project slug from the
   * INSERT statement for the `project` table. Returns undefined if not found.
   */
  private extractProjectSlugFromSqlDump(
    sqlDumpPath: string
  ): string | undefined {
    try {
      const sql = readFileSync(sqlDumpPath, 'utf8');
      // Match INSERT INTO (or INSERT OR REPLACE INTO) for the project table
      const insertRegex =
        /INSERT\s+(?:OR\s+REPLACE\s+)?INTO\s+["`]?project["`]?\s*\(([^)]+)\)\s*VALUES\s*\(([^;]+)\)\s*;/i;
      const match = insertRegex.exec(sql);
      if (!match) return undefined;

      const columnsRaw = match[1];
      const valuesRaw = match[2];

      const columns = columnsRaw
        .split(',')
        .map((c) => c.replace(/["`]/g, '').trim());
      const slugIdx = columns.findIndex(
        (c) => c.toLowerCase() === 'project_slug'
      );
      if (slugIdx < 0) return undefined;

      const values = this.splitSqlValues(valuesRaw);
      const rawSlug = values[slugIdx]?.trim();
      if (!rawSlug) return undefined;
      // Unwrap single quotes and unescape doubled quotes
      if (rawSlug.startsWith("'") && rawSlug.endsWith("'")) {
        const inner = rawSlug.slice(1, -1).replace(/''/g, "'");
        return inner;
      }
      // NULL or other types are not valid slugs
      return undefined;
    } catch (e) {
      this.logger.warn(`Unable to parse project slug from SQL dump: ${e}`);
      return undefined;
    }
  }

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
