import { TestBed } from '@angular/core/testing';
import { ScrollTag } from './scroll-tag.service';
import { ParameterUtils } from '../utils/parameter-utils.service';
import { EventUtils } from '../../utils/event-utils.service';
import { TagConfig, Trigger } from '@utils';

describe('ScrollTag', () => {
  let scrollTag: ScrollTag;
  let parameterUtils: ParameterUtils;
  let eventUtils: EventUtils;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ScrollTag, ParameterUtils, EventUtils]
    });

    scrollTag = TestBed.inject(ScrollTag);
    parameterUtils = TestBed.inject(ParameterUtils);
    eventUtils = TestBed.inject(EventUtils);
  });

  describe('createScrollTag', () => {
    it('should return an empty array if isIncludeScroll returns false', () => {
      // Arrange
      const configurationName = 'TestConfig';
      const accountId = 'account123';
      const containerId = 'container456';
      const triggers: Trigger[] = []; // Empty triggers

      // Act
      const result = scrollTag.createScrollTag(
        configurationName,
        accountId,
        containerId,
        triggers
      );

      // Assert
      expect(result).toEqual([]);
    });

    it('should return an empty array and log an error if trigger is not found', () => {
      // Arrange
      const configurationName = 'TestConfig';
      const accountId = 'account123';
      const containerId = 'container456';
      const triggers: Trigger[] = []; // No triggers matching 'event scroll'

      jest.spyOn(console, 'error').mockImplementation(() => {}); // Mock console.error

      // Act
      const result = scrollTag.createScrollTag(
        configurationName,
        accountId,
        containerId,
        triggers
      );

      // Assert
      expect(result).toEqual([]);
    });

    it('should create a valid scroll tag when trigger is found and scroll is included', () => {
      // Arrange
      const configurationName = 'TestConfig';
      const accountId = 'account123';
      const containerId = 'container456';
      const triggers: Trigger[] = [
        {
          name: 'event scroll',
          triggerId: 'trigger789'
        }
      ];

      jest.spyOn(eventUtils, 'isIncludeScroll').mockReturnValue(true);

      jest
        .spyOn(parameterUtils, 'createTemplateParameter')
        .mockImplementation((key, value) => ({ type: 'TEMPLATE', key, value }));

      jest.spyOn(parameterUtils, 'createBooleanParameter').mockReturnValue({
        type: 'BOOLEAN',
        key: 'sendEcommerceData',
        value: 'false'
      });

      jest.spyOn(parameterUtils, 'createBuiltInListParameter').mockReturnValue({
        type: 'LIST',
        key: 'eventParameters',
        list: [
          {
            type: 'MAP',
            map: [
              {
                type: 'TEMPLATE',
                key: 'parameter',
                value: 'scroll_percentage'
              },
              {
                type: 'TEMPLATE',
                key: 'parameterValue',
                value: '{{Scroll Depth Threshold}}'
              }
            ]
          }
        ]
      });
      jest
        .spyOn(parameterUtils, 'createMapParameter')
        .mockImplementation((key, value) => ({
          type: 'MAP',
          map: [{ type: 'TEMPLATE', key, value }]
        }));
      jest
        .spyOn(parameterUtils, 'createTagReferenceParameter')
        .mockImplementation((key, value) => ({
          type: 'TAG_REFERENCE',
          key,
          value
        }));

      // Act
      const result = scrollTag.createScrollTag(
        configurationName,
        accountId,
        containerId,
        triggers
      );

      // Assert
      const expected: TagConfig[] = [
        {
          accountId,
          containerId,
          name: 'GA4 event - scroll',
          type: 'gaawe',
          parameter: [
            { type: 'BOOLEAN', key: 'sendEcommerceData', value: 'false' },
            { type: 'TEMPLATE', key: 'eventName', value: 'scroll' },
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
                      value: 'scroll_percentage'
                    },
                    {
                      type: 'TEMPLATE',
                      key: 'parameterValue',
                      value: '{{Scroll Depth Threshold}}'
                    }
                  ]
                }
              ]
            },
            {
              type: 'TAG_REFERENCE',
              key: 'measurementId',
              value: configurationName
            }
          ],
          fingerprint: '1690184079241',
          firingTriggerId: ['trigger789'],
          tagFiringOption: 'ONCE_PER_EVENT',
          monitoringMetadata: {
            type: 'MAP'
          },
          consentSettings: {
            consentStatus: 'NOT_SET'
          }
        }
      ];

      expect(result).toEqual(expected);

      expect(parameterUtils.createBooleanParameter).toHaveBeenCalledWith(
        'sendEcommerceData',
        'false'
      );
      expect(parameterUtils.createTemplateParameter).toHaveBeenCalledWith(
        'eventName',
        'scroll'
      );
      expect(parameterUtils.createMapParameter).toHaveBeenCalledWith(
        'scroll_depth_threshold',
        '{{Scroll Depth Threshold}}'
      );
      expect(parameterUtils.createBuiltInListParameter).toHaveBeenCalledWith(
        'eventParameters',
        expect.any(Array)
      );
      expect(parameterUtils.createTagReferenceParameter).toHaveBeenCalledWith(
        'measurementId',
        configurationName
      );
    });
  });
});
