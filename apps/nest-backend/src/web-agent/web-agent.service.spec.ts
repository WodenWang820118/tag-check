import { Test } from '@nestjs/testing';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { describe, expect, it } from 'vitest';
import { WebAgentService } from './web-agent.service';

const moduleMocker = new ModuleMocker(global);
// TODO: Perform unit tests for the WebAgentService
describe('WebAgentService', () => {
  let service: WebAgentService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [WebAgentService],
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(
            token
          ) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    service = moduleRef.get<WebAgentService>(WebAgentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
