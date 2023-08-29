import { Test, TestingModule } from '@nestjs/testing';
import { SharedServiceService } from './shared-service.service';

describe('SharedServiceService', () => {
  let service: SharedServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SharedServiceService],
    }).compile();

    service = module.get<SharedServiceService>(SharedServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
