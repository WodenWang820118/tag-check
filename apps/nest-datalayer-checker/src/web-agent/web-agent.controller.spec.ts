import { Test, TestingModule } from '@nestjs/testing';
import { WebAgentController } from './web-agent.controller';

describe('WebAgentController', () => {
  let controller: WebAgentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebAgentController],
    }).compile();

    controller = module.get<WebAgentController>(WebAgentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
