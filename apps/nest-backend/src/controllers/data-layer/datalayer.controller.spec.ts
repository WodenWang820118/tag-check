import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { DataLayerController } from './datalayer.controller';

describe('DataLayerController', () => {
  function build(overrides: Record<string, unknown> = {}) {
    const eventInspectionControllerService = {
      inspectSingleEvent: vi.fn().mockResolvedValue(undefined),
      stopOperation: vi.fn().mockResolvedValue(undefined),
      ...overrides
    };
    const testReportFacadeRepositoryService = {
      getReportDetail: vi.fn().mockResolvedValue({ eventId: 'evt-1' })
    };
    const controller = new DataLayerController(
      eventInspectionControllerService as never,
      testReportFacadeRepositoryService as never
    );
    return {
      controller,
      eventInspectionControllerService,
      testReportFacadeRepositoryService
    };
  }

  describe('inspectSingleEvent', () => {
    it('runs the inspection then returns the report wrapped in an array', async () => {
      const {
        controller,
        eventInspectionControllerService,
        testReportFacadeRepositoryService
      } = build();
      const query = { headless: 'true' } as never;
      const preset = { foo: 'bar' } as never;
      const result = await controller.inspectSingleEvent(
        'proj-1',
        'evt-1',
        query,
        preset
      );
      expect(
        eventInspectionControllerService.inspectSingleEvent
      ).toHaveBeenCalledWith('proj-1', 'evt-1', query, preset);
      expect(
        testReportFacadeRepositoryService.getReportDetail
      ).toHaveBeenCalledWith('proj-1', 'evt-1');
      expect(result).toEqual([{ eventId: 'evt-1' }]);
    });

    it('rethrows HttpException as-is', async () => {
      const httpError = new HttpException('bad', HttpStatus.BAD_REQUEST);
      const { controller } = build({
        inspectSingleEvent: vi.fn().mockRejectedValue(httpError)
      });
      await expect(
        controller.inspectSingleEvent(
          'proj-1',
          'evt-1',
          {} as never,
          {} as never
        )
      ).rejects.toBe(httpError);
    });

    it('wraps unexpected errors in a 500 HttpException', async () => {
      const { controller } = build({
        inspectSingleEvent: vi.fn().mockRejectedValue(new Error('boom'))
      });
      await expect(
        controller.inspectSingleEvent(
          'proj-1',
          'evt-1',
          {} as never,
          {} as never
        )
      ).rejects.toMatchObject({
        status: HttpStatus.INTERNAL_SERVER_ERROR
      });
    });
  });

  it('stopOperation returns a 200 success envelope on the happy path', async () => {
    const { controller } = build();
    const result = await controller.stopOperation();
    expect(result).toEqual({
      status: 200,
      message: 'Operation stopped successfully'
    });
  });

  it('stopOperation wraps service errors in a 500 HttpException', async () => {
    const { controller } = build({
      stopOperation: vi.fn().mockRejectedValue(new Error('cannot stop'))
    });
    await expect(controller.stopOperation()).rejects.toMatchObject({
      status: HttpStatus.INTERNAL_SERVER_ERROR
    });
  });
});
