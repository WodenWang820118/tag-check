import { BadRequestException, Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { readFileSync } from 'fs';
import { FilePathOptions } from '../interfaces/filePathOptions.interface';

const rootDir = process.cwd();
const rootProjectFolder = 'projects';
const recordingFolder = 'dataLayer_recordings';
const configFolder = 'config';

@Injectable()
export class SharedService {
  private buildFilePath(
    projectName: string,
    folderName: string,
    fileName?: string
  ) {
    return path.join(
      rootDir,
      rootProjectFolder,
      projectName,
      folderName,
      fileName || ''
    );
  }

  private readJsonFile(filePath: string) {
    try {
      return JSON.parse(readFileSync(`${filePath}`, 'utf8'));
    } catch (error) {
      console.error('An error occurred:', error);
      return null;
    }
  }

  getOperationJson(projectName: string, options: FilePathOptions) {
    if (!projectName || !options) {
      throw new BadRequestException('Project name or options cannot be empty');
    }

    const filePath =
      options.absolutePath ||
      this.buildFilePath(projectName, recordingFolder, `${options.name}.json`);
    return this.readJsonFile(filePath);
  }

  getOperationJsonByProject(options: FilePathOptions) {
    const dirPath =
      options.absolutePath || this.buildFilePath(options.name, recordingFolder);
    const jsonFiles = this.getJsonFilesFromDir(dirPath);
    return jsonFiles.filter((file) => file.endsWith('.json'));
  }

  getSpecJsonByProject(options: FilePathOptions) {
    const dirPath =
      options.absolutePath || this.buildFilePath(options.name, configFolder);
    const jsonFiles = this.getJsonFilesFromDir(dirPath);
    const specFile = jsonFiles.find((file) => file.endsWith('.json'));
    return this.readJsonFile(path.join(dirPath, specFile));
  }

  getJsonFilesFromDir(dirPath: string): string[] {
    try {
      const files = fs.readdirSync(dirPath);
      return files.filter((file) => path.extname(file) === '.json');
    } catch (error) {
      console.error('An error occurred:', error);
      return [];
    }
  }
}
