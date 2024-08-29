import { Test, TestingModule } from '@nestjs/testing';
import { WebMonitoringService } from './web-monitoring.service';
import { RequestService } from './request/request.service';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

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
          const mockMetadata = moduleMocker.getMetadata(
            token
          ) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    service = module.get<WebMonitoringService>(WebMonitoringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
