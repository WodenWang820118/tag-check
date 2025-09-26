import { Injectable, Logger } from '@nestjs/common';
import { createWriteStream } from 'fs';
import archiver from 'archiver';

export interface ExtraFileDescriptor {
  path: string;
  name?: string;
}

@Injectable()
export class ProjectCompressor {
  private readonly logger = new Logger(ProjectCompressor.name);

  async compress(
    projectFolderPath: string,
    outputPath: string,
    projectSlug: string,
    extraFiles: ExtraFileDescriptor[] = []
  ): Promise<void> {
    this.logger.log(
      `Compressing project '${projectSlug}' at ${projectFolderPath} to ${outputPath}`
    );
    const output = createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);

    // Add project directory contents
    archive.directory(projectFolderPath, false);

    // Add extra files (e.g., fixture json) if provided
    for (const f of extraFiles) {
      try {
        const inferred =
          f.name ||
          (() => {
            const parts = f.path.split(/[/\\]/);
            return parts[parts.length - 1] || 'extra-file';
          })();
        archive.file(f.path, { name: inferred });
      } catch (e) {
        this.logger.warn(
          `Failed to add extra file to archive: ${f.path} - ${(e as Error).message}`
        );
      }
    }

    await new Promise<void>((resolve, reject) => {
      output.on('close', () => resolve());
      output.on('error', (err) => reject(err));
      archive.on('warning', (err: unknown) => {
        const code =
          typeof err === 'object' && err && 'code' in err
            ? (err as { code?: string }).code
            : undefined;
        if (code === 'ENOENT') {
          this.logger.warn(`Archive warning: ${(err as Error).message}`);
        } else {
          reject(err as Error);
        }
      });
      archive.on('error', (err) => reject(err));
      archive.finalize().catch(reject);
    });
  }
}
