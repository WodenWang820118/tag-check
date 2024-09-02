import { Test, TestingModule } from '@nestjs/testing';
import { RequestService } from './request.service';

describe('RequestService', () => {
  let service: RequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequestService],
    }).compile();

    service = module.get<RequestService>(RequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
