import { Test, TestingModule } from '@nestjs/testing';
import { ProjectIoService } from './project-io.service';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('ProjectIoService', () => {
  let service: ProjectIoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectIoService],
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
          return vi.fn();
        }
      })
      .compile();

    service = module.get<ProjectIoService>(ProjectIoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
