import { Test } from '@nestjs/testing';
import { ProjectAbstractReportService } from './project-abstract-report.service';
import { FolderPathService } from '../../infrastructure/os/path/folder-path/folder-path.service';
import { FolderService } from '../../infrastructure/os/folder/folder.service';
import { FilePathService } from '../../infrastructure/os/path/file-path/file-path.service';
import { FileService } from '../../infrastructure/os/file/file.service';
import * as fs from 'fs';
import { join } from 'path';
import { describe, beforeEach, it, expect, vi } from 'vitest';

vi.mock('fs', () => ({
  readFileSync: vi.fn(() => '{}'),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  statSync: vi.fn(() => ({
    mtime: new Date('2024-08-29T02:25:48.610Z')
  }))
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

const filePath = join(folder, 'abstract.json');
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
          price: 799
        }
      ]
    },
    'gtm.uniqueEventId': 64
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
          quantity: '$quantity' as any
        }
      ]
    }
  },
  destinationUrl: 'https://www.google.com',
  completedTime: new Date('2024-08-29T02:25:48.610Z')
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
        ProjectAbstractReportService
      ]
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
          return vi.fn();
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
    const folderPath = vi
      .spyOn(folderPathService, 'getInspectionEventFolderPath')
      .mockResolvedValue(folder);
    const abstractPath = vi
      .spyOn(filePathService, 'getInspectionResultFilePath')
      .mockResolvedValue(filePath);
    const existsSync = vi.spyOn(fs, 'existsSync');
    const mkdirSync = vi.spyOn(fs, 'mkdirSync');
    const writeJsonFile = vi.spyOn(fileService, 'writeJsonFile');

    await service.writeSingleAbstractTestResultJson(
      projectSlug,
      eventId,
      abstractJsonContent
    );

    expect(folderPath).toHaveBeenCalledWith(projectSlug, eventId);
    expect(abstractPath).toHaveBeenCalledWith(projectSlug, eventId);
    expect(existsSync).toHaveBeenCalledWith(folder);
    expect(mkdirSync).toHaveBeenCalledWith(folder, { recursive: true });
    expect(writeJsonFile).toHaveBeenCalledWith(join(folder, 'abstract.json'), {
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
              price: 799
            }
          ]
        },
        'gtm.uniqueEventId': 64
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
              quantity: '$quantity' as any
            }
          ]
        }
      },
      destinationUrl: 'https://www.google.com',
      completedTime: new Date('2024-08-29T02:25:48.610Z')
    });
  });

  it('should get single abstract test result json', async () => {
    const readJsonFile = vi.spyOn(fileService, 'readJsonFile');
    const abstractPath = vi
      .spyOn(filePathService, 'getInspectionResultFilePath')
      .mockResolvedValue(filePath);
    const existsSync = vi.spyOn(fs, 'existsSync').mockReturnValue(true);

    const result = await service.getSingleAbstractTestResultJson(
      projectSlug,
      eventId
    );
    expect(abstractPath).toHaveBeenCalledWith(projectSlug, eventId);
    expect(existsSync).toHaveBeenCalledWith(filePath);
    expect(readJsonFile).toHaveBeenCalledWith(filePath);
    expect(result).toBeDefined();

    // rmSync(filePath);
  });
});
