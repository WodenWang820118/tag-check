import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from './project.service';
import fs from 'fs';

describe('ProjectService', () => {
  let service: ProjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectService],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
  });

  it('should initProject', () => {
    // Set up the spy before calling the method that triggers the behavior
    const createFolderSpy = jest
      .spyOn(service, 'createFolder')
      .mockImplementation(() => {
        // You can provide a mock implementation or just return if not necessary
        return;
      });
    const updateSettingsFilePathSpy = jest
      .spyOn(service, 'updateSettingsFilePath')
      .mockImplementation(() => {
        return;
      });

    const mockWriteFileSync = jest
      .spyOn(fs, 'writeFileSync')
      .mockImplementation(() => {
        return;
      });

    service.rootProjectPath = '/mock/root/path';
    service.projectPath = '/mock/project/path';
    // Now call the method that should trigger the spied method
    service.initProject('test-project');

    // Assert that createFolder was called four times
    expect(createFolderSpy).toHaveBeenCalledTimes(4);

    // Assuming updateSettingsFilePath and mockWriteFileSync are spied elsewhere
    expect(updateSettingsFilePathSpy).toHaveBeenCalledTimes(1);
    expect(mockWriteFileSync).toHaveBeenCalledTimes(2);

    // Clean up the spy after the test
    createFolderSpy.mockRestore();
  });
});
