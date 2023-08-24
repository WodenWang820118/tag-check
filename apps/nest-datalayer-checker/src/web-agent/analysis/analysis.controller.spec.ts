import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisController } from './analysis.controller';

describe('AnalysisController', () => {
  let controller: AnalysisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisController],
    }).compile();

    controller = module.get<AnalysisController>(AnalysisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
