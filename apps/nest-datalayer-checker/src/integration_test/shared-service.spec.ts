import { SharedService } from '../shared-module/shared-service.service';
import { FilePathOptions } from '../interfaces/filePathOptions.interface';

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
  let sharedService: SharedService;

  beforeEach(() => {
    sharedService = new SharedService();
    // Setup: Create temp directories and files if needed.
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
      expect(specFile).toBe('spec.json'); // change this to the expected spec file name
    });

    it('should find a specific specification JSON file by absolute path', () => {
      // Act
      const options = { ...projectSpecOptions, name: '' };
      const specFile = sharedService.getSpecJsonByProject(options);

      // Assert
      expect(specFile).toBe('spec.json'); // change this to the expected spec file name
    });
  });

  it('should list all JSON files in a directory', () => {
    // Act
    const jsonFiles = sharedService.getJsonFilesFromDir(
      `${existingTempDir}/dataLayer_recordings`
    );

    // Assert
    expect(jsonFiles).toBeDefined();
    expect(jsonFiles.length).toBeGreaterThan(0);
  });
});
