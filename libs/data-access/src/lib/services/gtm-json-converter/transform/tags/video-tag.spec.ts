import { TestBed } from '@angular/core/testing';
import { VideoTag } from './video-tag.service';
import { ParameterUtils } from '../utils/parameter-utils.service';
import { EventUtils } from '../../utils/event-utils.service';
import { EventTagConfig, HTMLTagConfig, TagTypeEnum, Trigger } from '@utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('VideoTag', () => {
  let videoTag: VideoTag;
  let parameterUtils: ParameterUtils;
  let eventUtils: EventUtils;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VideoTag, ParameterUtils, EventUtils]
    });

    videoTag = TestBed.inject(VideoTag);
    parameterUtils = TestBed.inject(ParameterUtils);
    eventUtils = TestBed.inject(EventUtils);
  });

  describe('createVideoTag', () => {
    it('should return an empty array if isIncludeVideo returns false', () => {
      // Arrange
      const configurationName = 'TestConfig';
      const accountId = 'account123';
      const containerId = 'container456';
      const triggers: Trigger[] = []; // Empty triggers

      // Act
      const result = videoTag.createVideoTag(
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
      const triggers: Trigger[] = []; // No triggers matching 'event youtube video'

      vi.spyOn(eventUtils, 'isIncludeVideo').mockReturnValue(true);
      vi.spyOn(console, 'error').mockImplementation(() => {}); // Mock console.error

      // Act
      const result = videoTag.createVideoTag(
        configurationName,
        accountId,
        containerId,
        triggers
      );

      // Assert
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Error while creating video tag:',
        new Error("Couldn't find matching trigger for video tag")
      );
    });

    it('should create valid video tags when trigger is found and video is included', () => {
      // Arrange
      const configurationName = 'TestConfig';
      const accountId = 'account123';
      const containerId = 'container456';
      const triggers: Trigger[] = [
        {
          name: 'event youtube video',
          triggerId: 'trigger789'
        }
      ];

      vi.spyOn(eventUtils, 'isIncludeVideo').mockReturnValue(true);

      // Act
      const result = videoTag.createVideoTag(
        configurationName,
        accountId,
        containerId,
        triggers
      );

      // Assert
      const expected: EventTagConfig = {
        accountId,
        containerId,
        name: 'GA4 event - Video',
        type: TagTypeEnum.GAAWE,
        parameter: [
          { type: 'BOOLEAN', key: 'sendEcommerceData', value: 'false' },
          {
            type: 'TEMPLATE',
            key: 'eventName',
            value: 'video_{{Video Status}}'
          },
          {
            type: 'LIST',
            key: 'eventSettingsTable',
            list: [
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'video_current_time'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{Video Current Time}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'video_duration'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{Video Duration}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'video_percent'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{Video Percent}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'video_provider'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{Video Provider}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'video_title'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{Video Title}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'video_url'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{Video URL}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'visible'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{Video Visible}}'
                  }
                ]
              }
            ]
          },
          {
            type: 'TEMPLATE',
            key: 'measurementIdOverride',
            value: '{{Measurement ID}}'
          }
        ],
        fingerprint: '1690374452646',
        firingTriggerId: ['trigger789'],
        tagFiringOption: 'ONCE_PER_EVENT',
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      };

      const expectedHTMLScriptTag: HTMLTagConfig = {
        accountId,
        containerId,
        name: 'cHTML - Youtube iframe API script',
        type: TagTypeEnum.HTML,
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'html',
            value: '<script src="https://www.youtube.com/iframe_api">\n'
          },
          { type: 'BOOLEAN', key: 'supportDocumentWrite', value: 'false' }
        ],
        fingerprint: '1689848944995',
        firingTriggerId: ['trigger789'],
        tagFiringOption: 'ONCE_PER_EVENT',
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      };
      expect(result).toEqual([expected, expectedHTMLScriptTag]);
    });
  });
});
