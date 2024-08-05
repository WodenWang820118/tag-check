import { Test } from '@nestjs/testing';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { ProjectAbstractReportService } from './project-abstract-report.service';
import { FolderPathService } from '../../os/path/folder-path/folder-path.service';
import { FolderService } from '../../os/folder/folder.service';
import { FilePathService } from '../../os/path/file-path/file-path.service';
import { FileService } from '../../os/file/file.service';
import * as fs from 'fs';
import { join } from 'path';
import { rmSync } from 'fs';

const moduleMocker = new ModuleMocker(global);
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

const rootProjectPath = join(__dirname, '..', '..', '..', '..', '..');
const projectSlug = 'ng_gtm_integration_sample';
const eventId = 'add_payment_info_0afeb0fe-0905-4a78-9b81-d171b0fa48ff';

const folder = join(
  rootProjectPath,
  'tag_check_projects',
  projectSlug,
  'inspection_results',
  eventId
);

const filePath = join(folder, 'test_abstract.json');
const abstractJsonContent = {
  eventName: 'add_payment_info',
  passed: true,
  requestPassed: false,
  rawRequest: '',
  dataLayer: {
    event: 'add_payment_info',
    ecommerce: {
      value: 799,
      currency: 'USD',
      items: [
        {
          item_id: 'city001',
          item_name: 'Switzerland',
          item_category: 'Switzerland',
          quantity: 1,
          price: 799,
        },
      ],
    },
    'gtm.uniqueEventId': 64,
  },
  dataLayerSpec: {
    event: 'add_payment_info',
    ecommerce: {
      value: '$value' as any,
      currency: '$currency',
      items: [
        {
          item_id: '$item_id',
          item_name: '$item_name',
          item_category: '$item_category',
          price: '$price' as any,
          quantity: '$quantity' as any,
        },
      ],
    },
  },
  destinationUrl: 'https://www.google.com',
  completedTime: new Date(),
};

describe('ProjectAbstractReportService', () => {
  let service: ProjectAbstractReportService;
  let folderPathService: FolderPathService;
  let folderService: FolderService;
  let filePathService: FilePathService;
  let fileService: FileService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        FolderPathService,
        FolderService,
        FilePathService,
        FileService,
        ProjectAbstractReportService,
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

    service = moduleRef.get<ProjectAbstractReportService>(
      ProjectAbstractReportService
    );
    folderPathService = moduleRef.get<FolderPathService>(FolderPathService);
    folderService = moduleRef.get<FolderService>(FolderService);
    filePathService = moduleRef.get<FilePathService>(FilePathService);
    fileService = moduleRef.get<FileService>(FileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should write single abstract test result json', async () => {
    const folderPath = jest
      .spyOn(folderPathService, 'getInspectionEventFolderPath')
      .mockResolvedValue(folder);
    const abstractPath = jest
      .spyOn(filePathService, 'getInspectionResultFilePath')
      .mockResolvedValue(filePath);
    const existsSync = jest.spyOn(fs, 'existsSync');
    const mkdirSync = jest.spyOn(fs, 'mkdirSync');
    const writeJsonFile = jest.spyOn(fileService, 'writeJsonFile');

    await service.writeSingleAbstractTestResultJson(
      'projectSlug',
      'eventId',
      abstractJsonContent
    );

    expect(folderPath).toHaveBeenCalledWith('projectSlug', 'eventId');
    expect(abstractPath).toHaveBeenCalledWith('projectSlug', 'eventId');
    expect(existsSync).toHaveBeenCalledWith(folder);
    expect(mkdirSync).toHaveBeenCalledWith(folder, { recursive: true });
    expect(writeJsonFile).toHaveBeenCalledWith(
      join(folder, 'test_abstract.json'),
      {
        eventName: 'add_payment_info',
        passed: true,
        requestPassed: false,
        rawRequest: '',
        dataLayer: {
          event: 'add_payment_info',
          ecommerce: {
            value: 799,
            currency: 'USD',
            items: [
              {
                item_id: 'city001',
                item_name: 'Switzerland',
                item_category: 'Switzerland',
                quantity: 1,
                price: 799,
              },
            ],
          },
          'gtm.uniqueEventId': 64,
        },
        dataLayerSpec: {
          event: 'add_payment_info',
          ecommerce: {
            value: '$value' as any,
            currency: '$currency',
            items: [
              {
                item_id: '$item_id',
                item_name: '$item_name',
                item_category: '$item_category',
                price: '$price' as any,
                quantity: '$quantity' as any,
              },
            ],
          },
        },
        destinationUrl: 'https://www.google.com',
        completedTime: expect.any(Date),
      }
    );
  });

  it('should get single abstract test result json', async () => {
    const readJsonFile = jest.spyOn(fileService, 'readJsonFile');
    const abstractPath = jest
      .spyOn(filePathService, 'getInspectionResultFilePath')
      .mockResolvedValue(filePath);
    const existsSync = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const result = await service.getSingleAbstractTestResultJson(
      'projectSlug',
      'eventId'
    );
    expect(abstractPath).toHaveBeenCalledWith('projectSlug', 'eventId');
    expect(existsSync).toHaveBeenCalledWith(filePath);
    expect(readJsonFile).toHaveBeenCalledWith(filePath);
    expect(result).toBeDefined();

    rmSync(filePath);
  });
});
