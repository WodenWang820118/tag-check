import { Test, TestingModule } from '@nestjs/testing';
import { WebMonitoringService } from './web-monitoring.service';
import { RequestService } from './request/request.service';
import { describe, expect, it, vi } from 'vitest';

describe('WebMonitoringService', () => {
  let service: WebMonitoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebMonitoringService],
    })
      .useMocker((token) => {
        if (token === RequestService) {
          return {};
        }

        if (typeof token === 'function') {
          return vi.fn();
        }
      })
      .compile();

    service = module.get<WebMonitoringService>(WebMonitoringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
