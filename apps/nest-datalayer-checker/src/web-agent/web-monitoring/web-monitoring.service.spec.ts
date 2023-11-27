import { Test, TestingModule } from '@nestjs/testing';
import { WebMonitoringService } from './web-monitoring.service';

describe('AnalysisService', () => {
  let service: WebMonitoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebMonitoringService],
    }).compile();

    service = module.get<WebMonitoringService>(WebMonitoringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
