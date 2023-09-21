import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { readFileSync } from 'fs';
import path from 'path';
import { configFolder, recordingFolder, resultFolder } from '../utilities';
import { FilePathOptions } from '../../interfaces/filePathOptions.interface';
import { ProjectService } from '../project/project.service';

@Injectable()
export class FileService {
  constructor(private readonly projectService: ProjectService) {}

  private buildFilePath(
    projectName: string,
    folderName: string,
    fileName?: string
  ) {
    return path.join(
      this.projectService.rootProjectFolder,
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

  getReportSavingFolder(projectName: string) {
    return path.join(
      this.projectService.rootProjectFolder,
      projectName,
      resultFolder
    );
  }

  getOperationJson(projectName: string, options: FilePathOptions) {
    this.validateInput(projectName, options);

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

  private validateInput(projectName: string, options: FilePathOptions): void {
    if (!projectName || !options) {
      throw new BadRequestException('Project name or options cannot be empty');
    }
  }
}