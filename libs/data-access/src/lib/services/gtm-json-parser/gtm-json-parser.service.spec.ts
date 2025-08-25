import { GtmJsonParserService } from './gtm-json-parser.service';
import { describe, it, expect } from 'vitest';

const sample = JSON.stringify({
  exportFormatVersion: 2,
  exportTime: '2025-08-22 06:14:14',
  containerVersion: {
    path: 'accounts/6140708819/containers/168785492/versions/0',
    accountId: '6140708819',
    containerId: '168785492',
    containerVersionId: '0',
    container: {
      path: 'accounts/6140708819/containers/168785492',
      accountId: '6140708819',
      containerId: '168785492',
      name: 'ng-gtm-site',
      publicId: 'GTM-NBMX2DWS',
      usageContext: ['WEB'],
      fingerprint: '1697613095849',
      tagManagerUrl:
        'https://tagmanager.google.com/#/container/accounts/6140708819/containers/168785492/workspaces?apiLink=container',
      features: { supportTransformations: false },
      tagIds: []
    },
    tag: [
      {
        name: 'GA4 event - add_payment_info',
        type: 'gaawe',
        accountId: '6140708819',
        containerId: '168785492',
        parameter: [
          { type: 'BOOLEAN', key: 'sendEcommerceData', value: 'true' },
          { type: 'TEMPLATE', key: 'eventName', value: 'add_payment_info' },
          {
            type: 'LIST',
            key: 'eventParameters',
            list: [
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'ecommerce.currency'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.currency}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'ecommerce.items'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.items}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  { type: 'TEMPLATE', key: 'parameter', value: 'coupon' },
                  { type: 'TEMPLATE', key: 'parameterValue', value: 'SUMMER10' }
                ]
              }
            ]
          },
          { type: 'TAG_REFERENCE', key: 'measurementId', value: 'G-XXXX' }
        ],
        firingTriggerId: ['1'],
        tagFiringOption: 'ONCE_PER_EVENT',
        monitoringMetadata: { type: 'MAP' },
        consentSettings: { consentStatus: 'NOT_SET' }
      }
    ],
    trigger: [],
    variable: [],
    builtInVariable: [],
    fingerprint: '1755843254842',
    tagManagerUrl:
      'https://tagmanager.google.com/#/versions/accounts/6140708819/containers/168785492/versions/0?apiLink=version'
  }
});

describe('GtmJsonParserService', () => {
  it('parses GA4 event tags to Spec[] with ecommerce fields', () => {
    const svc = new GtmJsonParserService();
    const specs = svc.parse(sample);

    expect(specs.length).toBe(1);
    expect(specs[0]['event']).toBe('add_payment_info');

    const ec = specs[0]['ecommerce'] as unknown;
    if (ec && typeof ec === 'object') {
      expect((ec as { currency?: string }).currency).toBe('ecommerce.currency');
      // items should be a path string from template, not an array
      const items = (ec as { items?: unknown }).items;
      expect(Array.isArray(items)).toBe(false);
    }

    expect(specs[0]['coupon']).toBe('SUMMER10');
  });

  it('returns empty array when no GA4 event tags present', () => {
    const svc = new GtmJsonParserService();
    const json = JSON.stringify({
      exportFormatVersion: 2,
      containerVersion: { tag: [] }
    });
    const specs = svc.parse(json);
    expect(specs).toEqual([]);
  });
});
