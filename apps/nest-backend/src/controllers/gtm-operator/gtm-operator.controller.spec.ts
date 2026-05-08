import { HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { GtmOperatorController } from './gtm-operator.controller';

describe('GtmOperatorController', () => {
  function build(overrides: Record<string, unknown> = {}) {
    const gtmOperatorService = {
      inspectSingleEventViaGtm: vi.fn().mockResolvedValue(undefined),
      stopOperation: vi.fn(),
      ...overrides
    };
    const testReportFacadeRepositoryService = {
      getReportDetail: vi
        .fn()
        .mockResolvedValue({ eventId: 'evt-1', testEventDetails: {} })
    };
    const controller = new GtmOperatorController(
      gtmOperatorService as never,
      testReportFacadeRepositoryService as never
    );
    return {
      controller,
      gtmOperatorService,
      testReportFacadeRepositoryService
    };
  }

  it('inspectSingleEventViaGtm runs the inspection and returns the report wrapped in an array', async () => {
    const {
      controller,
      gtmOperatorService,
      testReportFacadeRepositoryService
    } = build();
    const query = { foo: 'bar' } as never;
    const preset = { baz: 1 } as never;
    const result = await controller.inspectSingleEventViaGtm(
      'proj-1',
      'evt-1',
      query,
      preset
    );
    expect(gtmOperatorService.inspectSingleEventViaGtm).toHaveBeenCalledWith(
      'proj-1',
      'evt-1',
      query,
      preset
    );
    expect(
      testReportFacadeRepositoryService.getReportDetail
    ).toHaveBeenCalledWith('proj-1', 'evt-1');
    expect(result).toEqual([{ eventId: 'evt-1', testEventDetails: {} }]);
  });

  it('stopOperation returns the 200 success envelope on the happy path', async () => {
    const { controller } = build();
    await expect(controller.stopOperation()).resolves.toEqual({
      status: 200,
      message: 'Operation stopped successfully'
    });
  });

  it('stopOperation wraps thrown errors in a 500 HttpException', async () => {
    const { controller } = build({
      stopOperation: vi.fn().mockImplementation(() => {
        throw new Error('cannot stop');
      })
    });
    await expect(controller.stopOperation()).rejects.toMatchObject({
      status: HttpStatus.INTERNAL_SERVER_ERROR
    });
  });
});
