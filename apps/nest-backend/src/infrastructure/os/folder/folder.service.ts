import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, mkdirSync, rmSync } from 'fs';

/** Creates and deletes folders under the projects folder. */
@Injectable()
export class FolderService {
  createFolder(folderPath: string) {
    // create folder only if it doesn't exist, use recursive to avoid errors if parent folders are missing
    if (!existsSync(folderPath)) {
      mkdirSync(folderPath, { recursive: true });
    }
  }

  /**
   * Deletes the folder and everything in it.
   *
   * @throws NotFoundException when the folder does not exist.
   */
  deleteFolder(folderPath: string) {
    if (!existsSync(folderPath)) {
      throw new NotFoundException('Folder not found');
    }
    rmSync(folderPath, { recursive: true, force: true });
  }
}
