import { Test, TestingModule } from '@nestjs/testing';
import { WaiterService } from './waiter.service';

describe('WaiterService', () => {
  let service: WaiterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WaiterService],
    }).compile();

    service = module.get<WaiterService>(WaiterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
