import { Test } from '@nestjs/testing';
import { DataLayerService } from './data-layer.service';
import { describe, expect, it, vi } from 'vitest';

// TODO: Perform unit tests for the DataLayerService
describe('DataLayerService', () => {
  let service: DataLayerService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [DataLayerService],
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
          return vi.fn();
        }
      })
      .compile();

    service = moduleRef.get<DataLayerService>(DataLayerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
