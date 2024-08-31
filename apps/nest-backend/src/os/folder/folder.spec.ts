import { Test } from '@nestjs/testing';
import { FolderService } from './folder.service';
import { describe, beforeEach, it, expect, vi } from 'vitest';

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
          return vi.fn();
        }
      })
      .compile();

    service = moduleRef.get<FolderService>(FolderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
