import { describe, expect, it, vi } from 'vitest';
import { GtmParserController } from './gtm-parser.controller';

describe('GtmParserController', () => {
  function build(overrides: Record<string, unknown> = {}) {
    const gtmParserService = {
      uploadGtmJson: vi.fn().mockResolvedValue('uploaded'),
      ...overrides
    };
    const controller = new GtmParserController(gtmParserService as never);
    return { controller, gtmParserService };
  }

  it('forwards the payload to the service and returns its summary', async () => {
    const { controller, gtmParserService } = build();
    const body = { exportFormatVersion: 2 };
    await expect(controller.uploadGtmJson('proj-1', body)).resolves.toBe(
      'uploaded'
    );
    expect(gtmParserService.uploadGtmJson).toHaveBeenCalledWith('proj-1', body);
  });

  it('rethrows underlying service errors', async () => {
    const error = new Error('upload failed');
    const { controller } = build({
      uploadGtmJson: vi.fn().mockRejectedValue(error)
    });
    await expect(controller.uploadGtmJson('proj-1', '{}')).rejects.toBe(error);
  });
});
