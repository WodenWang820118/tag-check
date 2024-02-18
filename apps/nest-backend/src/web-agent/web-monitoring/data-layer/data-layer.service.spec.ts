import { Test, TestingModule } from '@nestjs/testing';
import { DataLayerService } from './data-layer.service';
import { SharedService } from '../../../shared/shared.service';
import { ProjectService } from '../../../shared/project/project.service';
import { XlsxReportService } from '../../../shared/xlsx-report/xlsx-report.service';
import { FileService } from '../../../shared/file/file.service';
import path from 'path';
import fs from 'fs';
import { Page } from 'puppeteer';
import { mockPage } from '../../../mock/mock-service.spec';

describe('DataLayerService', () => {
  let service: DataLayerService;
  let sharedSerive: SharedService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataLayerService,
        SharedService,
        { provide: ProjectService, useValue: {} },
        {
          provide: FileService,
          useValue: {
            getReportSavingFolder: jest.fn(),
          },
        },
        { provide: XlsxReportService, useValue: {} },
        {
          provide: Page,
          useValue: mockPage,
        },
      ],
    }).compile();

    service = module.get<DataLayerService>(DataLayerService);
    sharedSerive = module.get<SharedService>(SharedService);
  });

  it('should initSelfDataLayer', () => {
    const getReportSavingFolderSpy = jest.spyOn(
      sharedSerive,
      'getReportSavingFolder'
    );

    const pathSpy = jest
      .spyOn(path, 'join')
      .mockReturnValue(
        'root/project/resultFolder/testName/testName - myDataLayer.json'
      );
    const writeFileSyncSpy = jest
      .spyOn(fs, 'writeFileSync')
      .mockImplementation();

    service.initSelfDataLayer('projectName', 'testName');

    expect(getReportSavingFolderSpy).toBeCalledTimes(1);
    expect(pathSpy).toBeCalledTimes(1);
    expect(writeFileSyncSpy).toBeCalledTimes(1);
  });

  it('should updateSelfDataLayer', async () => {
    const updateSelfDataLayerAlgorithmSpy = jest
      .spyOn(service, 'updateSelfDataLayerAlgorithm')
      .mockImplementation(
        (dataLayer: any[], projectName: string, testName: string) => {
          return;
        }
      );

    await service.updateSelfDataLayer(
      mockPage as any,
      'projectName',
      'testName'
    );
    expect(mockPage.waitForFunction).toBeCalledTimes(1);
    expect(mockPage.evaluate).toBeCalledTimes(1);
    expect(updateSelfDataLayerAlgorithmSpy).toBeCalledTimes(1);
  });

  it('should updateSelfDataLayerAlgorithm', () => {
    const getReportSavingFolderSpy = jest.spyOn(
      sharedSerive,
      'getReportSavingFolder'
    );
    const pathSpy = jest
      .spyOn(path, 'join')
      .mockReturnValue(
        'root/project/resultFolder/testName/testName - myDataLayer.json'
      );
    const readFileSyncSpy = jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValueOnce('[]');
    const JSONParseSpy = jest.spyOn(JSON, 'parse');
    const JSONStringifySpy = jest.spyOn(JSON, 'stringify');
    const writeFileSyncSpy = jest
      .spyOn(fs, 'writeFileSync')
      .mockImplementation();

    service.updateSelfDataLayerAlgorithm([], 'projectName', 'testName');

    expect(getReportSavingFolderSpy).toBeCalledTimes(1);
    expect(pathSpy).toBeCalledTimes(1);
    expect(readFileSyncSpy).toBeCalledTimes(1);
    expect(JSONParseSpy).toBeCalledTimes(1);
    expect(JSONStringifySpy).toBeCalledTimes(1);
    expect(writeFileSyncSpy).toBeCalledTimes(1);
  });

  it('should getMyDataLayer', () => {
    const getReportSavingFolderSpy = jest.spyOn(
      sharedSerive,
      'getReportSavingFolder'
    );
    const pathSpy = jest
      .spyOn(path, 'join')
      .mockReturnValue(
        'root/project/resultFolder/testName/testName - myDataLayer.json'
      );
    const readFileSyncSpy = jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValueOnce('[]');
    const JSONParseSpy = jest.spyOn(JSON, 'parse');

    service.getMyDataLayer('projectName', 'testName');

    expect(getReportSavingFolderSpy).toBeCalledTimes(1);
    expect(pathSpy).toBeCalledTimes(1);
    expect(readFileSyncSpy).toBeCalledTimes(1);
    expect(JSONParseSpy).toBeCalledTimes(1);
  });
});
