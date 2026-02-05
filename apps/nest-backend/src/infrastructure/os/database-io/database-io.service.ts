import { Injectable } from '@nestjs/common';

@Injectable()
export class DatabaseIoService {
  async dumpProjectDatabase(
    projectSlug: string,
    outputPath?: string
  ): Promise<unknown> {
    // Minimal stub to satisfy imports and type checking.
    throw new Error('dumpProjectDatabase not implemented');
  }

  async importProjectDatabase(sqlDumpPath: string): Promise<unknown> {
    // Minimal stub to satisfy imports and type checking.
    throw new Error('importProjectDatabase not implemented');
  }
}
