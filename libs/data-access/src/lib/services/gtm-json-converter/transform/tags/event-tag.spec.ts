import { TestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
import { EventTag } from './event-tag.service';
import { ParameterUtils } from '../utils/parameter-utils.service';
import { EventTagConfig, Tag, TagTypeEnum, Trigger } from '@utils';

describe('EventTag', () => {
  let eventTag: EventTag;
  let parameterUtils: ParameterUtils;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EventTag, ParameterUtils]
    });
    eventTag = TestBed.inject(EventTag);
    parameterUtils = TestBed.inject(ParameterUtils);
  });

  it('should create an event tag correctly', () => {
    // Arrange
    const eventTagName = 'exampleEventTag';
    const accountId = 'account123';
    const containerId = 'container456';
    const tag: Tag = {
      name: 'TestTag',
      parameters: [],
      triggers: [
        {
          name: 'TestTag',
          triggerId: '1'
        }
      ]
    };
    const triggers: Trigger[] = [
      {
        name: 'TestTag',
        triggerId: '1'
      }
    ];

    vi.spyOn(parameterUtils, 'createBooleanParameter').mockReturnValue({
      type: 'BOOLEAN',
      key: 'sendEcommerceData',
      value: 'false'
    });

    vi.spyOn(parameterUtils, 'createTemplateParameter').mockReturnValue({
      type: 'TEMPLATE',
      key: 'eventName',
      value: 'TestTag'
    });

    vi.spyOn(parameterUtils, 'createListParameter').mockReturnValue({
      type: 'LIST',
      key: 'eventParameters',
      list: []
    });

    vi.spyOn(parameterUtils, 'createTagReferenceParameter').mockReturnValue({
      type: 'TAG_REFERENCE',
      key: 'measurementId',
      value: 'GoogleTag'
    });

    // Act
    // TODO: reflect the esvContent
    const result = eventTag.createTag(
      eventTagName,
      accountId,
      containerId,
      tag,
      triggers,
      'false'
    );

    // Assert
    const expectedTag: EventTagConfig = {
      name: 'GA4 event - TestTag',
      type: TagTypeEnum.GAAWE,
      accountId: 'account123',
      containerId: 'container456',
      parameter: [
        { type: 'BOOLEAN', key: 'sendEcommerceData', value: 'false' },
        { type: 'TEMPLATE', key: 'eventName', value: 'TestTag' },
        { type: 'LIST', key: 'eventParameters', list: [] },
        { type: 'TAG_REFERENCE', key: 'measurementId', value: 'GoogleTag' }
      ],
      firingTriggerId: ['1'],
      tagFiringOption: 'ONCE_PER_EVENT',
      monitoringMetadata: {
        type: 'MAP'
      },
      consentSettings: {
        consentStatus: 'NOT_SET'
      }
    };

    expect(result).toEqual(expectedTag);
    expect(parameterUtils.createBooleanParameter).toHaveBeenCalledWith(
      'sendEcommerceData',
      'false'
    );
    expect(parameterUtils.createTemplateParameter).toHaveBeenCalledWith(
      'eventName',
      'TestTag'
    );
    expect(parameterUtils.createListParameter).toHaveBeenCalledWith(
      'eventParameters',
      tag.parameters
    );
    expect(parameterUtils.createTagReferenceParameter).toHaveBeenCalledWith(
      'measurementId',
      eventTagName
    );
  });
});
