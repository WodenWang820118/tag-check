import { Test, TestingModule } from '@nestjs/testing';
import { WaiterController } from './waiter.controller';

describe('WaiterController', () => {
  let controller: WaiterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WaiterController],
    }).compile();

    controller = module.get<WaiterController>(WaiterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
