import {
  HttpException,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { DatabaseIoController } from './database-io.controller';

describe('DatabaseIoController', () => {
  function build(overrides: Record<string, unknown> = {}) {
    const databaseIoService = {
      dumpProjectDatabase: vi.fn().mockResolvedValue('dumped'),
      importProjectDatabase: vi.fn().mockResolvedValue('imported'),
      ...overrides
    };
    const controller = new DatabaseIoController(databaseIoService as never);
    return { controller, databaseIoService };
  }

  describe('dumpProjectDatabase', () => {
    it('delegates to DatabaseIoService.dumpProjectDatabase on the happy path', async () => {
      const { controller, databaseIoService } = build();
      const result = await controller.dumpProjectDatabase('proj-1', '/out');
      expect(databaseIoService.dumpProjectDatabase).toHaveBeenCalledWith(
        'proj-1',
        '/out'
      );
      expect(result).toBe('dumped');
    });

    it('rethrows HttpException without wrapping', async () => {
      const httpError = new HttpException('bad', 400);
      const { controller } = build({
        dumpProjectDatabase: vi.fn().mockRejectedValue(httpError)
      });
      await expect(
        controller.dumpProjectDatabase('proj-1', '/out')
      ).rejects.toBe(httpError);
    });

    it('translates "not found" Errors into NotFoundException', async () => {
      const { controller } = build({
        dumpProjectDatabase: vi
          .fn()
          .mockRejectedValue(new Error('project not found'))
      });
      await expect(
        controller.dumpProjectDatabase('proj-1', '/out')
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('wraps other Errors in InternalServerErrorException', async () => {
      const { controller } = build({
        dumpProjectDatabase: vi.fn().mockRejectedValue(new Error('boom'))
      });
      await expect(
        controller.dumpProjectDatabase('proj-1', '/out')
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('wraps non-Error rejections in a generic InternalServerErrorException', async () => {
      const { controller } = build({
        dumpProjectDatabase: vi.fn().mockRejectedValue('string error')
      });
      await expect(
        controller.dumpProjectDatabase('proj-1', '/out')
      ).rejects.toMatchObject({
        message: 'An unknown error occurred'
      });
    });
  });

  describe('importProjectDatabase', () => {
    it('delegates to DatabaseIoService.importProjectDatabase on the happy path', async () => {
      const { controller, databaseIoService } = build();
      const result = await controller.importProjectDatabase('/in.sql');
      expect(databaseIoService.importProjectDatabase).toHaveBeenCalledWith(
        '/in.sql'
      );
      expect(result).toBe('imported');
    });

    it('rethrows HttpException as-is', async () => {
      const httpError = new HttpException('bad', 400);
      const { controller } = build({
        importProjectDatabase: vi.fn().mockRejectedValue(httpError)
      });
      await expect(controller.importProjectDatabase('/in.sql')).rejects.toBe(
        httpError
      );
    });

    it('translates "not found" Errors into NotFoundException', async () => {
      const { controller } = build({
        importProjectDatabase: vi
          .fn()
          .mockRejectedValue(new Error('dump file not found'))
      });
      await expect(
        controller.importProjectDatabase('/in.sql')
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('wraps other Errors in InternalServerErrorException', async () => {
      const { controller } = build({
        importProjectDatabase: vi.fn().mockRejectedValue(new Error('boom'))
      });
      await expect(
        controller.importProjectDatabase('/in.sql')
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });
});
