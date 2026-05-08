import { describe, expect, it, vi } from 'vitest';
import { GtmParserService } from './gtm-parser.service';

function build() {
  const folderPathService = {
    getProjectConfigFolderPath: vi.fn().mockResolvedValue('/cfg')
  };
  const fileService = {
    writeJsonFile: vi.fn(),
    readJsonFile: vi.fn()
  };
  const projectEventsBuilderService = { buildEvents: vi.fn() };
  const service = new GtmParserService(
    folderPathService as never,
    fileService as never,
    projectEventsBuilderService as never
  );
  return {
    service,
    folderPathService,
    fileService,
    projectEventsBuilderService
  };
}

const baseIds = { accountId: 'a', containerId: 'c' };

const validGtm = {
  exportFormatVersion: 2,
  exportTime: '2025-01-01 00:00:00',
  containerVersion: {
    variable: [],
    builtInVariable: [],
    trigger: [
      { triggerId: 't1', name: 'trigger-a', type: 'EVENT', ...baseIds }
    ],
    tag: [
      {
        name: 'tag-a',
        type: 'html',
        ...baseIds,
        firingTriggerId: ['t1'],
        parameter: [{ key: 'eventName', value: 'page_view', type: 'TEMPLATE' }]
      }
    ]
  }
};

const validGtmNoEvent = {
  exportFormatVersion: 2,
  exportTime: '2025-01-01 00:00:00',
  containerVersion: {
    variable: [],
    builtInVariable: [],
    trigger: [],
    tag: [
      {
        name: 'tag-a',
        type: 'html',
        ...baseIds,
        parameter: [{ key: 'other', value: 'v', type: 'TEMPLATE' }]
      }
    ]
  }
};

describe('GtmParserService', () => {
  it('writes the JSON file and builds events when given a valid GTM configuration object', async () => {
    const ctx = build();
    ctx.fileService.readJsonFile.mockReturnValue(validGtm);
    const result = await ctx.service.uploadGtmJson('demo', validGtm);
    expect(ctx.fileService.writeJsonFile).toHaveBeenCalledWith(
      expect.stringContaining('gtm-container.json'),
      validGtm
    );
    expect(ctx.projectEventsBuilderService.buildEvents).toHaveBeenCalledWith(
      'demo',
      [
        expect.objectContaining({
          eventName: 'page_view',
          testName: 'tag-a',
          recording: { title: 'page_view', steps: [] }
        })
      ]
    );
    expect(result).toEqual({ saved: true });
  });

  it('parses a stringified JSON payload before processing', async () => {
    const ctx = build();
    ctx.fileService.readJsonFile.mockReturnValue(validGtm);
    await ctx.service.uploadGtmJson('demo', JSON.stringify(validGtm));
    expect(ctx.fileService.writeJsonFile).toHaveBeenCalled();
    expect(ctx.projectEventsBuilderService.buildEvents).toHaveBeenCalled();
  });

  it('skips writeJsonFile and buildEvents when the payload is not a valid GTM configuration and no fallback exists', async () => {
    const ctx = build();
    ctx.fileService.readJsonFile.mockReturnValue(null);
    const result = await ctx.service.uploadGtmJson('demo', { not: 'gtm' });
    expect(ctx.fileService.writeJsonFile).not.toHaveBeenCalled();
    expect(ctx.projectEventsBuilderService.buildEvents).not.toHaveBeenCalled();
    expect(result).toEqual({ saved: true });
  });

  it('falls back to the saved file on disk when the payload is invalid JSON string', async () => {
    const ctx = build();
    ctx.fileService.readJsonFile.mockReturnValue(validGtm);
    const result = await ctx.service.uploadGtmJson('demo', 'not-json{');
    expect(ctx.projectEventsBuilderService.buildEvents).toHaveBeenCalled();
    expect(result).toEqual({ saved: true });
  });

  it('does not call buildEvents when no event tags carry an eventName parameter', async () => {
    const ctx = build();
    ctx.fileService.readJsonFile.mockReturnValue(validGtmNoEvent);
    await ctx.service.uploadGtmJson('demo', validGtmNoEvent);
    expect(ctx.projectEventsBuilderService.buildEvents).not.toHaveBeenCalled();
  });

  it('rethrows folder resolution failures', async () => {
    const ctx = build();
    ctx.folderPathService.getProjectConfigFolderPath.mockRejectedValue(
      new Error('no folder')
    );
    await expect(ctx.service.uploadGtmJson('demo', validGtm)).rejects.toThrow(
      'no folder'
    );
  });
});
