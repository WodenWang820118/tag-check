import { Test, TestingModule } from '@nestjs/testing';
import { WebAgentService } from './web-agent.service';

describe('WebAgentService', () => {
  let service: WebAgentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebAgentService],
    }).compile();

    service = module.get<WebAgentService>(WebAgentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
