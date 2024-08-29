import { Test, TestingModule } from '@nestjs/testing';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { ProjectIoService } from './project-io.service';
import { describe, beforeEach, it, expect } from 'vitest';

const moduleMocker = new ModuleMocker(global);

describe('ProjectIoService', () => {
  let service: ProjectIoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectIoService],
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

    service = module.get<ProjectIoService>(ProjectIoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
