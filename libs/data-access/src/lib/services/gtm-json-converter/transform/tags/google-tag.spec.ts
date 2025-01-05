import { TestBed } from '@angular/core/testing';
import { GoogleTag } from './google-tag.service';
import { ParameterUtils } from '../utils/parameter-utils.service';
import { GoogleTagConfig, TagTypeEnum } from '@utils';

describe('Google Tag', () => {
  let googleTag: GoogleTag;
  let parameterUtils: ParameterUtils;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GoogleTag, ParameterUtils]
    });

    googleTag = TestBed.inject(GoogleTag);
    parameterUtils = TestBed.inject(ParameterUtils);
  });

  it('should create a valid GA4 configuration', () => {
    // Arrange
    const googleTagName = 'TestGoogleTag';
    const measurementId = 'G-12345678';
    const accountId = 'account123';
    const containerId = 'container456';

    jest
      .spyOn(parameterUtils, 'createBooleanParameter')
      .mockReturnValueOnce({
        type: 'BOOLEAN',
        key: 'sendPageView',
        value: 'false'
      })
      .mockReturnValueOnce({
        type: 'BOOLEAN',
        key: 'enableSendToServerContainer',
        value: 'false'
      });

    jest.spyOn(parameterUtils, 'createTemplateParameter').mockReturnValue({
      type: 'TEMPLATE',
      key: 'measurementId',
      value: 'G-12345678'
    });

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
        { type: 'TEMPLATE', key: 'measurementId', value: 'G-12345678' },
        { type: 'BOOLEAN', key: 'sendPageView', value: 'false' },
        { type: 'BOOLEAN', key: 'enableSendToServerContainer', value: 'false' }
      ],
      firingTriggerId: ['2147479553'],
      tagFiringOption: 'ONCE_PER_EVENT',
      monitoringMetadata: {
        type: 'MAP'
      },
      consentSettings: {
        consentStatus: 'NOT_SET'
      }
    };
    expect(result).toEqual(expectedTag);

    expect(parameterUtils.createBooleanParameter).toHaveBeenCalledTimes(2);
    expect(parameterUtils.createTemplateParameter).toHaveBeenCalledTimes(1);
    expect(parameterUtils.createBooleanParameter).toHaveBeenCalledWith(
      'sendPageView',
      'false'
    );
    expect(parameterUtils.createBooleanParameter).toHaveBeenCalledWith(
      'enableSendToServerContainer',
      'false'
    );
    expect(parameterUtils.createTemplateParameter).toHaveBeenCalledWith(
      'tagId',
      '{{CONST - Measurement ID}}'
    );
  });
});
