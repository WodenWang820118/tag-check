import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
import { extname } from 'path';

@Injectable()
export class FolderService {
  readFolderFiles(folderPath: string) {
    if (!existsSync(folderPath)) {
      throw new NotFoundException('Folder not found');
    }
    return readdirSync(folderPath, {
      withFileTypes: true
    });
  }

  readFolderFileNames(folderPath: string) {
    if (!existsSync(folderPath)) {
      throw new NotFoundException('Folder not found');
    }
    return readdirSync(folderPath);
  }

  readFolder(folderPath: string) {
    if (!existsSync(folderPath)) {
      throw new NotFoundException('Folder not found');
    }
    return readdirSync(folderPath, {
      withFileTypes: true
    }).filter((dirent) => dirent.isDirectory());
  }

  createFolder(folderPath: string) {
    // create folder only if it doesn't exist, use recursive to avoid errors if parent folders are missing
    if (!existsSync(folderPath)) {
      mkdirSync(folderPath, { recursive: true });
    }
  }

  getJsonFilesFromDir(dirPath: string) {
    if (!existsSync(dirPath)) {
      throw new NotFoundException('Folder not found');
    }

    const files = readdirSync(dirPath);
    if (!files.length) {
      throw new NotFoundException('No files found');
    }

    return files.filter((file) => extname(file) === '.json');
  }

  deleteFolder(folderPath: string) {
    if (!existsSync(folderPath)) {
      throw new NotFoundException('Folder not found');
    }
    rmSync(folderPath, { recursive: true, force: true });
  }
}
