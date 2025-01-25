/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { createReadStream, createWriteStream } from 'fs';
import * as unzipper from 'unzipper';
import archiver from 'archiver';

@Injectable()
export class ProjectIoService {
  private readonly logger = new Logger(ProjectIoService.name);
  async compressProject(
    projectFolderPath: string,
    outputPath: string
  ): Promise<void> {
    this.logger.log(
      `Compressing project at ${projectFolderPath} to ${outputPath}`
    );
    const output = createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    archive.pipe(output);
    archive.directory(projectFolderPath, false);
    await archive.finalize().catch((error) => {
      throw new HttpException(
        {
          message: 'Failed to compress project',
          error: error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    });
  }

  async unzipProject(
    projectSlug: string,
    zipFilePath: string,
    outputFolderPath: string
  ): Promise<void> {
    const outputPath = `${outputFolderPath}/${projectSlug}`;
    const readStream = createReadStream(zipFilePath);
    const extractStream = unzipper.Extract({ path: outputPath });

    try {
      await new Promise<void>((resolve, reject) => {
        readStream
          .pipe(extractStream)
          .on('close', () => {
            resolve();
          })
          .on('error', (err) => {
            reject(err);
          });

        readStream.on('error', (err) => {
          reject(err);
        });
      });
    } catch (error) {
      this.logger.error(
        `Failed to unzip project ${projectSlug}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw new HttpException(
        'Failed to unzip project',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    } finally {
      readStream.destroy();
      extractStream.end();
    }
  }
}
