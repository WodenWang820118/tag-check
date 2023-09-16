import { Test, TestingModule } from '@nestjs/testing';
import { WebMonitoringController } from './web-monitoring.controller';

describe('AnalysisController', () => {
  let controller: WebMonitoringController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebMonitoringController],
    }).compile();

    controller = module.get<WebMonitoringController>(WebMonitoringController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
