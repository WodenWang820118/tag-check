import { Test, TestingModule } from '@nestjs/testing';
import { GcsMonitorService } from './gcs-monitor.service';

describe('GcsMonitorService', () => {
  let service: GcsMonitorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GcsMonitorService],
    }).compile();

    service = module.get<GcsMonitorService>(GcsMonitorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
