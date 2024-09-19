import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { WebAgentService } from './web-agent.service';

// TODO: Perform unit tests for the WebAgentService
describe('WebAgentService', () => {
  let service: WebAgentService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [WebAgentService],
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
          return vi.fn();
        }
      })
      .compile();

    service = moduleRef.get<WebAgentService>(WebAgentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
