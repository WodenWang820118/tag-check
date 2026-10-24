import { TestBed } from '@angular/core/testing';
import { GoogleTag } from './google-tag.service';
import { ParameterUtils } from '../utils/parameter-utils.service';
import { GoogleTagConfig, TagTypeEnum } from '@utils';
import { describe, it, expect } from 'vitest';

describe('Google Tag', () => {
  let googleTag: GoogleTag;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GoogleTag, ParameterUtils]
    });

    googleTag = TestBed.inject(GoogleTag);
  });

  it('should create a valid GA4 configuration', () => {
    // Arrange
    const googleTagName = 'TestGoogleTag';
    const measurementId = 'G-12345678';
    const accountId = 'account123';
    const containerId = 'container456';

    // Act
    const result = googleTag.createGA4Configuration(
      googleTagName,
      measurementId,
      accountId,
      containerId
    );

    // Assert
    const expectedTag: GoogleTagConfig = {
      name: 'TestGoogleTag',
      type: TagTypeEnum.GOOGLE_TAG,
      accountId: 'account123',
      containerId: 'container456',
      parameter: [
        {
          type: 'TEMPLATE',
          key: 'tagId',
          value: '{{CONST - Measurement ID}}'
        },
        {
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
        },
        { type: 'BOOLEAN', key: 'enableSendToServerContainer', value: 'false' }
      ],
      firingTriggerId: ['2147479553'],
      tagFiringOption: 'ONCE_PER_EVENT',
      monitoringMetadata: {
        type: 'MAP'
      },
      consentSettings: {
        consentStatus: 'NOT_NEEDED'
      }
    };
    expect(result).toEqual(expectedTag);
  });
});
