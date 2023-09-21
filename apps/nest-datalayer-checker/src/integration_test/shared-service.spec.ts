import { WaiterService } from '../waiter/waiter.service';
import { SharedService } from '../shared/shared.service';
import { FilePathOptions } from '../interfaces/filePathOptions.interface';
import { ProjectService } from '../shared/project/project.service';
import { FileService } from '../shared/file/file.service';
import { mkdirSync, rm, writeFileSync } from 'fs';
import path from 'path';

const rootDir = process.cwd();
const rootProjectFolder = 'projects';
const projectName = 'gtm_config_generator';
const existingTempDir = `${rootDir}/${rootProjectFolder}/${projectName}`;

const operationFileOptions: FilePathOptions = {
  name: 'btn_convert_click.json',
  absolutePath: `${existingTempDir}/dataLayer_recordings/btn_convert_click.json`,
};

const projectJsonOptions: FilePathOptions = {
  name: 'gtm_config_generator',
  absolutePath: `${existingTempDir}/dataLayer_recordings`,
};

const projectSpecOptions: FilePathOptions = {
  name: 'gtm_config_generator',
  absolutePath: `${existingTempDir}/config`,
};

describe('SharedService Integration Tests', () => {
  const projectService = new ProjectService();
  const fileService = new FileService(projectService);
  const sharedService = new SharedService(projectService, fileService);
  const waiterService = new WaiterService(sharedService);

  beforeAll(() => {
    waiterService.selectRootProjectFolder(
      path.join(rootDir, rootProjectFolder)
    );
    waiterService.initProject(projectName);
    // Specify the directories and filenames
    const dataLayerRecordingsDir = `${existingTempDir}/dataLayer_recordings`;
    const configFileDir = `${existingTempDir}/config`;

    // Create or ensure the directories exist
    mkdirSync(dataLayerRecordingsDir, { recursive: true });
    mkdirSync(configFileDir, { recursive: true });

    // Prepare some sample data
    const sampleData = {
      key: 'value',
    };
    const sampleConfig = {
      configKey: 'configValue',
    };

    // Write the JSON files
    writeFileSync(
      `${dataLayerRecordingsDir}/btn_convert_click.json`,
      JSON.stringify(sampleData, null, 2)
    );
    writeFileSync(
      `${configFileDir}/spec.json`,
      JSON.stringify(sampleConfig, null, 2)
    );
  });

  afterAll(() => {
    rm(existingTempDir, { recursive: true }, (err) => {
      if (err) {
        throw err;
      }
    });
  });

  describe('getOperationJson', () => {
    it('should read a specific JSON file according to the project name and the file name', () => {
      // Act
      const options = { ...operationFileOptions, absolutePath: '' };
      const result = sharedService.getOperationJson(projectName, options);
      // Assert
      expect(result).toBeDefined();
    });
    it('should read a specific JSON file according to absolute path', () => {
      // Act
      const options = { ...operationFileOptions, name: '' };
      const result = sharedService.getOperationJson(projectName, options);
      // Assert
      expect(result).toBeDefined();
    });
  });
  describe('getOperationJsonByProject', () => {
    it('should list all JSON files given a specific project name', () => {
      // Act
      const options = { ...projectJsonOptions, absolutePath: '' };
      const projectFiles = sharedService.getOperationJsonByProject(options);
      // Assert
      expect(projectFiles).toBeDefined();
      expect(projectFiles.length).toBeGreaterThan(0);
    });
    it('should list all JSON files given a full absolute path', () => {
      // Act
      const options = { ...projectJsonOptions, name: '' };
      const projectFiles = sharedService.getOperationJsonByProject(options);
      // Assert
      expect(projectFiles).toBeDefined();
      expect(projectFiles.length).toBeGreaterThan(0);
    });
  });
  describe('getSpecJsonByProject', () => {
    it('should find a specific specification JSON file by project name', () => {
      // Act
      const options = { ...projectSpecOptions, absolutePath: '' };
      const specFile = sharedService.getSpecJsonByProject(options);
      // Assert
      expect(specFile).toBeDefined();
    });
    it('should find a specific specification JSON file by absolute path', () => {
      // Act
      const options = { ...projectSpecOptions, name: '' };
      const specFile = sharedService.getSpecJsonByProject(options);
      console.log('specFile', specFile);
      // Assert
      expect(specFile).toBeDefined();
    });
  });
});
