import { Test } from '@nestjs/testing';
import { FolderPathService } from '../../../infrastructure/os/path/folder-path/folder-path.service';
import { FolderService } from '../../../infrastructure/os/folder/folder.service';
import { FilePathService } from '../../../infrastructure/os/path/file-path/file-path.service';
import { FileService } from '../../../infrastructure/os/file/file.service';
import { ProjectInitializationService } from './project-initialization.service';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { ConfigsService } from '../../../core/configs/configs.service';

describe('ProjectInitializationService', () => {
  let service: ProjectInitializationService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectInitializationService,
        FolderPathService,
        FolderService,
        FilePathService,
        FileService,
        ConfigsService
      ]
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
          return vi.fn();
        }
      })
      .compile();

    service = moduleRef.get<ProjectInitializationService>(
      ProjectInitializationService
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
