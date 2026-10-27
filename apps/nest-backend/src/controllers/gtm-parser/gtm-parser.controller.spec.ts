import { describe, expect, it, vi } from 'vitest';
import { GtmParserController } from './gtm-parser.controller';

describe('GtmParserController', () => {
  function build(overrides: Record<string, unknown> = {}) {
    const gtmParserService = {
      uploadGtmJson: vi.fn().mockResolvedValue('uploaded'),
      previewGtmJson: vi.fn().mockResolvedValue({ conflicts: [] }),
      ...overrides
    };
    const controller = new GtmParserController(gtmParserService as never);
    return { controller, gtmParserService };
  }

  it('forwards a container and a resolved import body', async () => {
    const { controller, gtmParserService } = build();
    const container = { exportFormatVersion: 2 };
    const resolved = {
      container,
      resolutions: { 'GA4 - purchase': 'update' as const }
    };

    await expect(controller.uploadGtmJson('proj-1', container)).resolves.toBe(
      'uploaded'
    );
    await expect(controller.uploadGtmJson('proj-1', resolved)).resolves.toBe(
      'uploaded'
    );

    expect(gtmParserService.uploadGtmJson).toHaveBeenNthCalledWith(
      1,
      'proj-1',
      container
    );
    expect(gtmParserService.uploadGtmJson).toHaveBeenNthCalledWith(
      2,
      'proj-1',
      resolved
    );
  });

  it('previews with the same body and does not upload', async () => {
    const { controller, gtmParserService } = build();
    const body = { exportFormatVersion: 2 };

    await expect(controller.previewGtmJson('proj-1', body)).resolves.toEqual({
      conflicts: []
    });
    expect(gtmParserService.previewGtmJson).toHaveBeenCalledWith(
      'proj-1',
      body
    );
    expect(gtmParserService.uploadGtmJson).not.toHaveBeenCalled();
  });

  it('rethrows underlying service errors', async () => {
    const error = new Error('upload failed');
    const { controller } = build({
      uploadGtmJson: vi.fn().mockRejectedValue(error)
    });
    await expect(controller.uploadGtmJson('proj-1', '{}')).rejects.toBe(error);
  });
});
