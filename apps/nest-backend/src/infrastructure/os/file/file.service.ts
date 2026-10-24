import { Injectable, NotFoundException } from '@nestjs/common';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { FilePathService } from '../path/file-path/file-path.service';

/** Reads and writes the JSON files of the projects folder. */
@Injectable()
export class FileService {
  constructor(private readonly filePathService: FilePathService) {}

  /**
   * @returns The file's JSON content, cast to `T` without validation.
   * @throws NotFoundException when the file does not exist; a SyntaxError
   * when it is not valid JSON.
   */
  readJsonFile<T>(filePath: string): T {
    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }
    return JSON.parse(readFileSync(filePath, 'utf8')) as T;
  }

  /** Writes `content` as indented JSON, creating the folder if needed. */
  writeJsonFile(filePath: string, content: unknown) {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(filePath, JSON.stringify(content, null, 2));
  }

  /** Writes a run's raw result to the test's result cache file. */
  async writeCacheFile(projectSlug: string, eventId: string, data: unknown) {
    this.writeJsonFile(
      await this.filePathService.getCacheFilePath(projectSlug, eventId),
      data
    );
  }
}
