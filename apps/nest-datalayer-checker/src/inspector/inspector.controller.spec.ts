import { Test, TestingModule } from '@nestjs/testing';
import { InspectorController } from './inspector.controller';

describe('InspectorController', () => {
  let controller: InspectorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InspectorController],
    }).compile();

    controller = module.get<InspectorController>(InspectorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
