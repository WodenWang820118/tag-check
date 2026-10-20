import { Injectable } from '@nestjs/common';

@Injectable()
export class DatabaseIoService {
  async dumpProjectDatabase(
    _projectSlug: string,
    _outputPath?: string
  ): Promise<unknown> {
    // Minimal stub to satisfy imports and type checking.
    throw new Error('dumpProjectDatabase not implemented');
  }

  async importProjectDatabase(_sqlDumpPath: string): Promise<unknown> {
    // Minimal stub to satisfy imports and type checking.
    throw new Error('importProjectDatabase not implemented');
  }
}
