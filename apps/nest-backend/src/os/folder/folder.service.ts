import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
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
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  deleteFolder(folderPath: string) {
    try {
      rmSync(folderPath, { recursive: true });
    } catch (error) {
      Logger.error(error.message, 'FolderService.deleteFolder');
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
