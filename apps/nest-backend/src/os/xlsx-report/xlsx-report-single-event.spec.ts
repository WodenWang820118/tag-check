import { Test, TestingModule } from '@nestjs/testing';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { XlsxReportSingleEventService } from './xlsx-report-single-event.service';
import { FolderPathService } from '../path/folder-path/folder-path.service';
import { FilePathService } from '../path/file-path/file-path.service';
import { join } from 'path';
import { existsSync, rmSync } from 'fs';

const moduleMocker = new ModuleMocker(global);

describe('XlsxReportSingleEventService', () => {
  let service: XlsxReportSingleEventService;
  let folderPathService: FolderPathService;
  let filePathService: FilePathService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        XlsxReportSingleEventService,
        FolderPathService,
        FilePathService,
      ],
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(
            token
          ) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    service = module.get<XlsxReportSingleEventService>(
      XlsxReportSingleEventService
    );
    folderPathService = module.get<FolderPathService>(FolderPathService);
    filePathService = module.get<FilePathService>(FilePathService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should write xlsx file', async () => {
    // it turns out to be a integration test to test the file creation
    const fileName = 'test.xlsx';
    const mockEventId = 'add_payment_info_0afeb0fe-0905-4a78-9b81-d171b0fa48ff';
    const mockProjectName = 'ng_gtm_integration_sample';

    const eventSavingFolder = jest
      .spyOn(folderPathService, 'getInspectionEventFolderPath')
      .mockResolvedValue(
        join(
          'tag_check_projects',
          mockProjectName,
          'inspection_results',
          mockEventId
        )
      );

    const getImageFilePath = jest
      .spyOn(filePathService, 'getImageFilePath')
      .mockResolvedValue(
        join(
          'tag_check_projects',
          mockProjectName,
          'inspection_results',
          mockEventId,
          'add_payment_info.png'
        )
      );

    const mockData = {
      dataLayerResult: 'test',
      requestCheckResult: 'test',
      rawRequest: 'test',
      destinationUrl: 'test',
    };

    await service.writeXlsxFile(
      fileName,
      'sheet1',
      mockData,
      mockEventId,
      mockProjectName
    );

    expect(eventSavingFolder).toHaveBeenCalledWith(
      mockProjectName,
      mockEventId
    );
    expect(getImageFilePath).toHaveBeenCalledWith(mockProjectName, mockEventId);

    // Verify that the file was created
    const expectedFilePath = join(
      'tag_check_projects',
      mockProjectName,
      'inspection_results',
      mockEventId,
      fileName
    );
    expect(existsSync(expectedFilePath)).toBeTruthy();

    // Clean up
    rmSync(expectedFilePath);
  });
});