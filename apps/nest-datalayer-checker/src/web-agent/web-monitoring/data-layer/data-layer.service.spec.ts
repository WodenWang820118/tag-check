import { Test, TestingModule } from '@nestjs/testing';
import { DataLayerService } from './data-layer.service';

describe('DataLayerService', () => {
  let service: DataLayerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataLayerService],
    }).compile();

    service = module.get<DataLayerService>(DataLayerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
