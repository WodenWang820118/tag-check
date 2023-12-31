import {
  BadRequestException,
  Injectable,
  Logger,
  StreamableFile,
} from '@nestjs/common';
import { createReadStream, existsSync, readFileSync, readdirSync } from 'fs';
import path from 'path';
import { configFolder, recordingFolder, resultFolder } from '../utilities';
import { FilePathOptions } from '../../interfaces/filePathOptions.interface';
import { ProjectService } from '../project/project.service';
import { ConfigurationService } from '../../configuration/configuration.service';

@Injectable()
export class FileService {
  constructor(
    private readonly projectService: ProjectService,
    private configurationService: ConfigurationService
  ) {}

  private async buildFilePath(
    projectName: string,
    folderName: string,
    fileName?: string
  ) {
    try {
      const dbRootProjectPath =
        await this.configurationService.getRootProjectPath();
      const dbCurrentProjectPath =
        await this.configurationService.getCurrentProjectPath();

      const filePath2 = path.join(
        dbRootProjectPath,
        dbCurrentProjectPath,
        folderName,
        fileName || ''
      );
      Logger.log('file path ', filePath2, 'FileService.buildFilePath');

      return filePath2;
    } catch (error) {
      Logger.error(error, 'FileService.buildFilePath');
      const filePath = path.join(
        await this.projectService.getRootProjectFolder(),
        projectName,
        folderName,
        fileName || ''
      );
      return filePath;
    }
  }

  private readJsonFile(filePath: string) {
    try {
      return JSON.parse(readFileSync(`${filePath}`, 'utf8'));
    } catch (error) {
      // console.error('An error occurred:', error);
      throw new BadRequestException(
        `An error occurred while reading the file: ${filePath}`
      );
    }
  }

  async getReportSavingFolder(projectName: string) {
    try {
      const dbRootProjectPath =
        await this.configurationService.getRootProjectPath();
      const dbCurrentProjectPath =
        await this.configurationService.getCurrentProjectPath();
      const folder = path.join(
        dbRootProjectPath,
        dbCurrentProjectPath,
        resultFolder
      );
      Logger.log(
        'report saving folder ',
        folder,
        'FileService.getReportSavingFolder'
      );
      return folder;
    } catch (error) {
      Logger.error(error, 'FileService.getReportSavingFolder');
      return path.join(
        await this.projectService.getRootProjectFolder(),
        projectName,
        resultFolder
      );
    }
  }

  async getOperationJson(projectName: string, options: FilePathOptions) {
    this.validateInput(projectName, options);

    const filePath =
      options.absolutePath ||
      (await this.buildFilePath(
        projectName,
        recordingFolder,
        `${options.name}.json`
      ));

    Logger.log(`filePath: ${filePath}`, 'FileService.getOperationJson');
    return this.readJsonFile(filePath);
  }

  async getOperationJsonByProject(options: FilePathOptions) {
    const dirPath =
      options.absolutePath ||
      (await this.buildFilePath(options.name, recordingFolder));
    const jsonFiles = this.getJsonFilesFromDir(dirPath);
    return jsonFiles.filter((file) => file.endsWith('.json'));
  }

  async getSpecJsonByProject(options: FilePathOptions) {
    const dirPath =
      options.absolutePath ||
      (await this.buildFilePath(options.name, configFolder));
    const jsonFiles = this.getJsonFilesFromDir(dirPath);
    const specFile = jsonFiles.find((file) => file.endsWith('.json'));
    return this.readJsonFile(path.join(dirPath, specFile));
  }

  getJsonFilesFromDir(dirPath: string): string[] {
    try {
      const files = readdirSync(dirPath);
      return files.filter((file) => path.extname(file) === '.json');
    } catch (error) {
      throw new BadRequestException(
        `An error occurred while reading the directory: ${dirPath}`
      );
    }
  }

  findDestinationUrl(json: any): string | null {
    const steps = json.steps;
    if (!steps || !Array.isArray(steps)) {
      return null;
    }

    for (let i = steps.length - 1; i >= 0; i--) {
      const step = steps[i];
      if (step.type === 'navigate' && step.url) {
        return step.url;
      }
    }

    return null;
  }

  validateInput(projectName: string, options: FilePathOptions): void {
    if (!projectName || !options) {
      throw new BadRequestException('Project name or options cannot be empty');
    }
  }

  async getEventReport(projectName: string, testName: string) {
    if (!existsSync(await this.buildFilePath(projectName, resultFolder))) {
      throw new BadRequestException(`Project ${projectName} does not exist!`);
    }

    // use regex and testName to get an array of XLSX files
    const regex = new RegExp(`${testName}.*.xlsx`);
    const files = readdirSync(
      await this.buildFilePath(projectName, resultFolder)
    );
    const filteredFiles = files.filter((file) => regex.test(file));

    if (filteredFiles.length === 0) {
      throw new BadRequestException(`Test ${testName} does not exist!`);
    }

    // return the all files
    Logger.log(filteredFiles, 'FileService.readSingleTestReport');
    return filteredFiles;
  }

  async readReport(projectName: string, reportName: string) {
    try {
      const reportSavingFolder = await this.getReportSavingFolder(projectName);
      const reportPath = path.join(reportSavingFolder, `${reportName}`);

      if (!existsSync(reportPath)) {
        throw new Error(`File not found: ${reportPath}`);
      }

      Logger.log(reportPath, 'FileService.readReport');
      return new StreamableFile(createReadStream(reportPath));
    } catch (error) {
      Logger.error(error, 'FileService.readReport');
      throw new BadRequestException(error);
    }
  }

  async getSpecsPath(projectName: string) {
    return await this.buildFilePath(projectName, configFolder, 'spec.json');
  }
}
