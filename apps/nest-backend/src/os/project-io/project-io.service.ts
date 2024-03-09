import { HttpException, Injectable, Logger } from '@nestjs/common';
import { createReadStream, createWriteStream } from 'fs';
import * as unzipper from 'unzipper';

import archiver from 'archiver';

@Injectable()
export class ProjectIoService {
  async compressProject(
    projectFolderPath: string,
    outputPath: string
  ): Promise<void> {
    try {
      Logger.log(
        `Compressing project at ${projectFolderPath} to ${outputPath}`
      );
      const output = createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: { level: 9 },
      });

      archive.on('error', function (err) {
        Logger.log(err);
      });

      archive.pipe(output);
      archive.directory(projectFolderPath, false);
      await archive.finalize();
    } catch (error) {
      Logger.error(error);
      throw new HttpException('Failed to compress project', 500);
    }
  }

  async unzipProject(
    projectSlug: string,
    zipFilePath: string,
    outputFolderPath: string
  ): Promise<void> {
    try {
      const outputPath = `${outputFolderPath}/${projectSlug}`;
      return createReadStream(zipFilePath)
        .pipe(unzipper.Extract({ path: outputPath }))
        .promise();
    } catch (error) {
      Logger.error(error);
      throw new HttpException('Failed to unzip project', 500);
    }
  }
}
