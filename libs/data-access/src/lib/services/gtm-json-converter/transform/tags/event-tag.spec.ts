import { TestBed } from '@angular/core/testing';
import { EventTag } from './event-tag.service';
import { ParameterUtils } from '../utils/parameter-utils.service';
import { EventTagConfig, Tag, TagTypeEnum, Trigger } from '@utils';

describe('EventTag', () => {
  let eventTag: EventTag;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EventTag, ParameterUtils]
    });
    eventTag = TestBed.inject(EventTag);
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
        { type: 'LIST', key: 'eventSettingsTable', list: [] },
        {
          type: 'TEMPLATE',
          key: 'measurementIdOverride',
          value: '{{CONST - Measurement ID}}'
        }
      ],
      firingTriggerId: ['1'],
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
