import { Test } from '@nestjs/testing';
import { ImageService } from './image.service';
import { StreamableFile } from '@nestjs/common';
import { FolderPathService } from '../path/folder-path/folder-path.service';
import { join } from 'path';
import { describe, beforeEach, expect, vi } from 'vitest';

describe('FolderImageServiceService', () => {
  let service: ImageService;
  let folderPathService: FolderPathService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ImageService, FolderPathService],
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
          return vi.fn();
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
    const rootProjectPath = join(__dirname, '..', '..', '..', '..', '..');
    const projectSlug = 'ng_gtm_integration_sample';
    const eventId = 'add_payment_info_0afeb0fe-0905-4a78-9b81-d171b0fa48ff';
    const imageSavingFolderPath = join(
      rootProjectPath,
      'tag_check_projects',
      projectSlug,
      'inspection_results',
      eventId
    );

    vi.spyOn(
      folderPathService,
      'getInspectionEventFolderPath'
    ).mockResolvedValue(imageSavingFolderPath);

    const result = await service.readImage(projectSlug, eventId);

    expect(result).toBeInstanceOf(StreamableFile);
  });
});
