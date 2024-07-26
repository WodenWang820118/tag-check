import { Test } from '@nestjs/testing';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { FolderService } from './folder.service';
import { Dirent } from 'fs';

const moduleMocker = new ModuleMocker(global);

describe('FolderService', () => {
  let service: FolderService;
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [FolderService],
    })
      .useMocker((token) => {
        if (token === FolderService) {
          return {};
        }

        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(
            token
          ) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    service = moduleRef.get<FolderService>(FolderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
