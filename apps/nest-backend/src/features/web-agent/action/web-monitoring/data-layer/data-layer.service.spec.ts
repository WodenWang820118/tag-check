import { Test } from '@nestjs/testing';
import { runInNewContext } from 'node:vm';
import {
  DATA_LAYER_SNAPSHOT_SCRIPT,
  DataLayerService
} from './data-layer.service';
import { describe, expect, it, vi } from 'vitest';
import { DataLayerValidationUtilsService } from '../../../../inspector/strategy/data-layer-validation-utils.service';
import { EcommerceEventValidationStrategy } from '../../../../inspector/strategy/ecommerce-event-validation-strategy.service';

// TODO: Perform unit tests for the DataLayerService
describe('DataLayerService', () => {
  let service: DataLayerService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [DataLayerService]
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
          return vi.fn();
        }
      })
      .compile();

    service = moduleRef.get<DataLayerService>(DataLayerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

describe('DataLayerService.updateSelfDataLayerAlgorithm', () => {
  function build() {
    const files = new Map<string, unknown>();
    const fileService = {
      readJsonFile: vi.fn((path: string) => files.get(path)),
      writeJsonFile: vi.fn((path: string, data: unknown) => {
        files.set(path, data);
      })
    };
    const folderPathService = {
      getReportSavingFolderPath: vi.fn().mockResolvedValue('reports')
    };
    const service = new DataLayerService(
      folderPathService as never,
      fileService as never,
      {} as never
    );
    const merged = () => [...files.values()][0] as Record<string, unknown>[];
    return { service, merged };
  }

  // gtag('consent', 'default', ...) pushes an arguments object, which the
  // snapshot copies as a plain object with numeric keys.
  const consentDefault = {
    0: 'consent',
    1: 'default',
    2: { ad_storage: 'denied', analytics_storage: 'denied' }
  };
  const purchase = {
    event: 'purchase',
    ecommerce: { transaction_id: 'T_1', value: 10, currency: 'USD' }
  };

  it('keeps the reset before an event when the next page pushes gtag commands', async () => {
    const { service, merged } = build();

    // Checkout page, when the purchase request is sent.
    await service.updateSelfDataLayerAlgorithm(
      [consentDefault, { event: 'gtm.js' }, { ecommerce: null }, purchase],
      'shop',
      'purchase_1'
    );
    // Thank-you page, after the navigation.
    await service.updateSelfDataLayerAlgorithm(
      [consentDefault, { event: 'gtm.js' }, { event: 'gtm.dom' }],
      'shop',
      'purchase_1'
    );

    const result = new EcommerceEventValidationStrategy(
      new DataLayerValidationUtilsService()
    ).validateDataLayer(merged() as never, purchase as never);
    expect(result.passed).toBe(true);
    expect(merged()).toEqual([
      consentDefault,
      { event: 'gtm.js' },
      { ecommerce: null },
      purchase,
      { event: 'gtm.dom' }
    ]);
  });

  it('does not repeat the pushes of a page snapshotted twice', async () => {
    const { service, merged } = build();
    const page = [consentDefault, { ecommerce: null }, purchase];

    await service.updateSelfDataLayerAlgorithm(page, 'shop', 'purchase_1');
    await service.updateSelfDataLayerAlgorithm(page, 'shop', 'purchase_1');

    expect(merged()).toEqual(page);
  });
});

describe('DATA_LAYER_SNAPSHOT_SCRIPT', () => {
  function snapshot(dataLayer: unknown) {
    // A fresh context: the page has none of the bundle's helpers.
    return runInNewContext(DATA_LAYER_SNAPSHOT_SCRIPT, {
      dataLayer,
      structuredClone
    });
  }

  it('keeps pushes that hold functions or DOM nodes, minus those values', () => {
    const element = { nodeType: 1, onclick: () => 'clicked' };
    const result = snapshot([
      { event: 'page_view', page_path: '/home' },
      () => 'gtm preview command',
      { event: 'gtm.click', 'gtm.element': element, 'gtm.elementId': 'cta' },
      { event: 'view_item', callback: () => 'done', ecommerce: { value: 799 } }
    ]);

    expect(JSON.parse(JSON.stringify(result))).toEqual([
      { event: 'page_view', page_path: '/home' },
      { event: 'gtm.click', 'gtm.elementId': 'cta' },
      { event: 'view_item', ecommerce: { value: 799 } }
    ]);
  });

  it('reports a missing data layer', () => {
    expect(JSON.parse(JSON.stringify(snapshot(undefined)))).toEqual([
      { event: 'no data layer' }
    ]);
  });
});
