import { describe, it, expect, vi } from 'vitest';
import { InspectorSingleEventService } from './inspector-single-event.service';
import { FileService } from '../../infrastructure/os/file/file.service';
import { WebAgentService } from '../web-agent/web-agent.service';
import { RequestProcessorService } from '../../features/request-processor/request-processor.service';
import { InspectorUtilsService } from './inspector-utils.service';
import { SpecRepositoryService } from '../../core/repository/spec/spec-repository.service';
import { ItemDefRepositoryService } from '../../core/repository/item-def/item-def-repository.service';

describe('InspectorSingleEventService', () => {
  function build(opts?: {
    spec?: unknown;
    itemDef?: unknown;
    dataLayerCorrect?: unknown;
    captureResult?: unknown;
    noCaptureResult?: unknown;
  }) {
    const spec = opts?.spec ?? {
      eventName: 'view_item',
      dataLayerSpec: {
        event: 'view_item',
        ecommerce: { items: [{ item_id: 'placeholder' }] }
      }
    };
    const captureResult = opts?.captureResult ?? {
      dataLayer: [{ event: 'view_item' }],
      destinationUrl: 'https://x',
      eventRequest: 'raw=1'
    };
    const noCaptureResult = opts?.noCaptureResult ?? {
      dataLayer: [{ event: 'view_item' }],
      destinationUrl: 'https://x'
    };
    const dataLayerCorrect = opts?.dataLayerCorrect ?? { passed: true };

    const webAgentService = {
      executeAndGetDataLayer: vi.fn().mockResolvedValue(noCaptureResult),
      executeAndGetDataLayerAndRequest: vi.fn().mockResolvedValue(captureResult)
    } as unknown as WebAgentService;
    const fileService = {
      writeCacheFile: vi.fn().mockResolvedValue(undefined)
    } as unknown as FileService;
    const requestProcessorService = {
      recomposeGA4ECEvent: vi.fn(() => ({ event: 'view_item' }))
    } as unknown as RequestProcessorService;
    const inspectorUtilsService = {
      isDataLayerCorrect: vi.fn(() => dataLayerCorrect)
    } as unknown as InspectorUtilsService;
    const specRepositoryService = {
      getSpecByProjectSlugAndEventId: vi.fn().mockResolvedValue(spec)
    } as unknown as SpecRepositoryService;
    const itemDefRepositoryService = {
      getItemDefById: vi.fn().mockResolvedValue(opts?.itemDef ?? null)
    } as unknown as ItemDefRepositoryService;

    return {
      svc: new InspectorSingleEventService(
        webAgentService,
        fileService,
        requestProcessorService,
        inspectorUtilsService,
        specRepositoryService,
        itemDefRepositoryService
      ),
      webAgentService,
      fileService,
      inspectorUtilsService,
      specRepositoryService,
      itemDefRepositoryService
    };
  }

  it('takes the no-capture path when captureRequest is "false"', async () => {
    const { svc, webAgentService, fileService } = build();
    const result = await svc.inspectDataLayer(
      {} as never,
      'p',
      'evt',
      'M-1',
      { username: 'u', password: 'p' },
      'false',
      undefined as never
    );
    expect(webAgentService.executeAndGetDataLayer).toHaveBeenCalled();
    expect(
      webAgentService.executeAndGetDataLayerAndRequest
    ).not.toHaveBeenCalled();
    expect(fileService.writeCacheFile).toHaveBeenCalled();
    expect(result.rawRequest).toBe('');
    expect(result.destinationUrl).toBe('https://x');
  });

  it('takes the capture path when captureRequest is "true"', async () => {
    const { svc, webAgentService, fileService } = build();
    const result = await svc.inspectDataLayer(
      {} as never,
      'p',
      'evt',
      'M-1',
      { username: 'u', password: 'p' },
      'true',
      undefined as never
    );
    expect(webAgentService.executeAndGetDataLayerAndRequest).toHaveBeenCalled();
    expect(webAgentService.executeAndGetDataLayer).not.toHaveBeenCalled();
    expect(fileService.writeCacheFile).toHaveBeenCalled();
    expect(result.rawRequest).toBe('raw=1');
  });

  it('replaces ecommerce.items with the item-def fullItemDef when present', async () => {
    const { svc, specRepositoryService, itemDefRepositoryService } = build({
      itemDef: { fullItemDef: { item_id: 'real' } }
    });
    await svc.inspectDataLayer(
      {} as never,
      'p',
      'evt',
      'M',
      { username: '', password: '' },
      'false',
      undefined as never
    );
    expect(
      specRepositoryService.getSpecByProjectSlugAndEventId
    ).toHaveBeenCalledWith('p', 'evt');
    expect(itemDefRepositoryService.getItemDefById).toHaveBeenCalledWith(
      'view_item'
    );
  });
});
