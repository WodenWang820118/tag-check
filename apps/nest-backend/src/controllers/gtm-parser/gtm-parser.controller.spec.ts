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

  it('getGtmJson resolves with an empty object placeholder', async () => {
    const { controller } = build();
    await expect(controller.getGtmJson('proj-1')).resolves.toEqual({});
  });

  it('uploadGtmJson parses string bodies as JSON before forwarding', async () => {
    const { controller, gtmParserService } = build();
    const result = await controller.uploadGtmJson(
      'proj-1',
      JSON.stringify({ container: 'x' })
    );
    expect(gtmParserService.uploadGtmJson).toHaveBeenCalledWith('proj-1', {
      container: 'x'
    });
    expect(result).toBe('uploaded');
  });

  it('uploadGtmJson forwards non-JSON string bodies untouched', async () => {
    const { controller, gtmParserService } = build();
    await controller.uploadGtmJson('proj-1', 'not-json');
    expect(gtmParserService.uploadGtmJson).toHaveBeenCalledWith(
      'proj-1',
      'not-json'
    );
  });

  it('uploadGtmJson forwards object bodies untouched', async () => {
    const { controller, gtmParserService } = build();
    const body = { foo: 'bar' } as unknown as string;
    await controller.uploadGtmJson('proj-1', body);
    expect(gtmParserService.uploadGtmJson).toHaveBeenCalledWith('proj-1', body);
  });

  it('uploadGtmJson rethrows underlying service errors', async () => {
    const error = new Error('upload failed');
    const { controller } = build({
      uploadGtmJson: vi.fn().mockRejectedValue(error)
    });
    await expect(controller.uploadGtmJson('proj-1', '{}')).rejects.toBe(error);
  });
});
