import { HttpException, Injectable, Logger } from '@nestjs/common';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import path from 'path';

@Injectable()
export class FolderService {
  readFolderFiles(folderPath: string) {
    return readdirSync(folderPath, {
      withFileTypes: true,
    });
  }

  readFolderFileNames(folderPath: string) {
    return readdirSync(folderPath);
  }

  createFolder(folderPath: string) {
    if (!existsSync(folderPath)) {
      mkdirSync(folderPath);
    }
  }

  getJsonFilesFromDir(dirPath: string) {
    try {
      const files = readdirSync(dirPath);
      return files.filter((file) => path.extname(file) === '.json');
    } catch (error) {
      Logger.error(error.message, 'FolderService.getJsonFilesFromDir');
      throw new HttpException(error.message, 500);
    }
  }
}
