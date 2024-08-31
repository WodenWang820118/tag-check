import { Test } from '@nestjs/testing';
import { FileService } from './file.service';
import { StreamableFile } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('FileService', () => {
  let service: FileService;
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [FileService],
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
          return vi.fn();
        }
      })
      .compile();

    service = moduleRef.get<FileService>(FileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should read JSON file', () => {
    const filePath = 'test.json';
    const data = { test: 'test' };
    vi.spyOn(service, 'readJsonFile').mockReturnValue(data);
    expect(service.readJsonFile(filePath)).toEqual(data);
  });

  it('should get operation JSON by project', async () => {
    const projectSlug = 'test';
    const data = ['test.json'];
    vi.spyOn(service, 'getOperationJsonByProject').mockResolvedValue(data);
    expect(await service.getOperationJsonByProject(projectSlug)).toEqual(data);
  });

  it('should get event report', async () => {
    const projectSlug = 'test';
    const eventId = 'test';
    const data = {} as StreamableFile;
    vi.spyOn(service, 'getEventReport').mockResolvedValue(data);
    expect(await service.getEventReport(projectSlug, eventId)).toEqual(data);
  });
});
