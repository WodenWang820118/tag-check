import { Test } from '@nestjs/testing';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { FileService } from './file.service';
import { StreamableFile } from '@nestjs/common';

const moduleMocker = new ModuleMocker(global);

describe('FileService', () => {
  let service: FileService;
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [FileService],
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

    service = moduleRef.get<FileService>(FileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should read JSON file', () => {
    const filePath = 'test.json';
    const data = { test: 'test' };
    jest.spyOn(service, 'readJsonFile').mockReturnValue(data);
    expect(service.readJsonFile(filePath)).toEqual(data);
  });

  it('should get operation JSON by project', async () => {
    const projectSlug = 'test';
    const data = ['test.json'];
    jest.spyOn(service, 'getOperationJsonByProject').mockResolvedValue(data);
    expect(await service.getOperationJsonByProject(projectSlug)).toEqual(data);
  });

  it('should get event report', async () => {
    const projectSlug = 'test';
    const eventId = 'test';
    const data = {} as StreamableFile;
    jest.spyOn(service, 'getEventReport').mockResolvedValue(data);
    expect(await service.getEventReport(projectSlug, eventId)).toEqual(data);
  });
});
