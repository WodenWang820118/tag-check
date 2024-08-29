import { Test } from '@nestjs/testing';
import { DataLayerService } from './data-layer.service';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { describe, expect, it } from 'vitest';

const moduleMocker = new ModuleMocker(global);
// TODO: Perform unit tests for the DataLayerService
describe('DataLayerService', () => {
  let service: DataLayerService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [DataLayerService],
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

    service = moduleRef.get<DataLayerService>(DataLayerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
