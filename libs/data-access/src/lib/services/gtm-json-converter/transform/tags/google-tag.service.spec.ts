import { TestBed } from '@angular/core/testing';
import { TagTypeEnum } from '@utils';

import { GoogleTag } from './google-tag.service';

describe('GoogleTag', () => {
  let service: GoogleTag;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoogleTag);
  });

  it('produces a GA4 configuration with the supplied identifiers', () => {
    const config = service.createGA4Configuration(
      'GA4 Tag',
      'G-ABC123',
      'acc-1',
      'cnt-1'
    );

    expect(config.name).toBe('GA4 Tag');
    expect(config.accountId).toBe('acc-1');
    expect(config.containerId).toBe('cnt-1');
    expect(config.type).toBe(TagTypeEnum.GOOGLE_TAG);
    expect(config.tagFiringOption).toBe('ONCE_PER_EVENT');
    expect(config.firingTriggerId).toEqual(['2147479553']);
    expect(config.monitoringMetadata).toEqual({ type: 'MAP' });
    expect(config.consentSettings?.consentStatus).toBe('NOT_NEEDED');
  });

  it('emits tagId, configSettingsTable and enableSendToServerContainer', () => {
    const config = service.createGA4Configuration('GA4', 'G-1', 'a', 'c');

    const keys = config.parameter?.map((p) => p.key);
    expect(keys).toEqual([
      'tagId',
      'configSettingsTable',
      'enableSendToServerContainer'
    ]);

    const tagId = config.parameter?.[0];
    expect(tagId?.type).toBe('TEMPLATE');
    expect(tagId?.value).toBe('{{CONST - Measurement ID}}');

    // The Google tag's settings table, as Tag Manager exports it.
    expect(config.parameter?.[1]).toEqual({
      type: 'LIST',
      key: 'configSettingsTable',
      list: [
        {
          type: 'MAP',
          map: [
            { type: 'TEMPLATE', key: 'parameter', value: 'send_page_view' },
            { type: 'TEMPLATE', key: 'parameterValue', value: 'false' }
          ]
        }
      ]
    });

    const sst = config.parameter?.[2];
    expect(sst?.type).toBe('BOOLEAN');
    expect(sst?.value).toBe('false');
  });
});
