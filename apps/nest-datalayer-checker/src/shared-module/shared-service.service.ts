import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { readFileSync } from 'fs';
import * as fs from 'fs';

@Injectable()
export class SharedServiceService {
  /**
   * Returns the operation JSON object for a given operation name
   * @param name The name of the operation
   * @returns The operation JSON object
   */
  getOperationJson(name: string, filePath?: string) {
    const rootDir = process.cwd();
    const pathToUse = filePath
      ? `\\recordings\\${filePath}`
      : `\\recordings\\${name}`;
    const fullPath = path.join(rootDir, pathToUse, `${name}`);
    return JSON.parse(readFileSync(fullPath, 'utf8'));
  }

  getJsonFilesFromDir(dirPath: string): string[] {
    try {
      const files = fs.readdirSync(dirPath);
      const jsonFiles = files.filter((file) => path.extname(file) === '.json');
      return jsonFiles;
    } catch (error) {
      console.error('An error occurred:', error);
      return [];
    }
  }

  getOperationJsonByProject(project: string, folderPath?: string) {
    const rootDir = process.cwd();
    const pathToUse = folderPath ? `${folderPath}` : `recordings\\${project}`;
    const fullPath = path.join(rootDir, pathToUse);

    const jsonFiles = this.getJsonFilesFromDir(fullPath);

    // If you want only files that match the project name
    const projectFiles = jsonFiles.filter((file) => file.endsWith(`.json`));

    return projectFiles;
  }
}
