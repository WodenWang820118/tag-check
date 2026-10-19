import { Test } from '@nestjs/testing';
import { runInNewContext } from 'node:vm';
import {
  DATA_LAYER_SNAPSHOT_SCRIPT,
  DataLayerService
} from './data-layer.service';
import { describe, expect, it, vi } from 'vitest';

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
