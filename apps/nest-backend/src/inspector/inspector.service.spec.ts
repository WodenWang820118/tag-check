import { Test, TestingModule } from '@nestjs/testing';
import { InspectorService } from './inspector.service';

describe('InspectorService', () => {
  let service: InspectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InspectorService],
    }).compile();

    service = module.get<InspectorService>(InspectorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
