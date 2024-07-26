import { Test } from '@nestjs/testing';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { ImageService } from './image.service';
import { StreamableFile } from '@nestjs/common';
import { FolderPathService } from '../path/folder-path/folder-path.service';
import { join } from 'path';

const moduleMocker = new ModuleMocker(global);

describe('FolderImageServiceService', () => {
  let service: ImageService;
  let folderPathService: FolderPathService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ImageService, FolderPathService],
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

    service = moduleRef.get<ImageService>(ImageService);
    folderPathService = moduleRef.get<FolderPathService>(FolderPathService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should read image', async () => {
    // it turns out to be a integration test to test the image reading
    const rootProjectPath = 'D:/software development/tag-check';
    const projectSlug = 'ng_gtm_integration_sample';
    const eventId = 'add_payment_info_0afeb0fe-0905-4a78-9b81-d171b0fa48ff';
    const imageSavingFolderPath = join(
      rootProjectPath,
      'tag_check_projects',
      projectSlug,
      'inspection_results',
      eventId
    );

    jest
      .spyOn(folderPathService, 'getInspectionEventFolderPath')
      .mockResolvedValue(imageSavingFolderPath);

    const result = await service.readImage(projectSlug, eventId);

    expect(result).toBeInstanceOf(StreamableFile);
  });
});
