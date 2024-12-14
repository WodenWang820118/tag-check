import { TestBed } from '@angular/core/testing';
import { VideoTrigger } from './video-trigger.service';
import { EventUtils } from '../../utils/event-utils.service';
import { TriggerConfig } from '@utils';

describe('VideoTrigger', () => {
  let service: VideoTrigger;
  let eventUtils: EventUtils;
  let mockVideoTriggerConfig: TriggerConfig;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VideoTrigger, EventUtils]
    });

    service = TestBed.inject(VideoTrigger);
    eventUtils = TestBed.inject(EventUtils);

    mockVideoTriggerConfig = {
      accountId: 'test-account',
      containerId: 'test-container',
      name: 'event youtube video',
      type: 'YOU_TUBE_VIDEO',
      fingerprint: '1689849183312',
      parameter: [
        {
          type: 'TEMPLATE',
          key: 'progressThresholdsPercent',
          value: '10,25,50,75'
        },
        { type: 'BOOLEAN', key: 'captureComplete', value: 'true' },
        { type: 'BOOLEAN', key: 'captureStart', value: 'true' },
        { type: 'BOOLEAN', key: 'fixMissingApi', value: 'true' },
        { type: 'TEMPLATE', key: 'triggerStartOption', value: 'WINDOW_LOAD' },
        { type: 'TEMPLATE', key: 'radioButtonGroup1', value: 'PERCENTAGE' },
        { type: 'BOOLEAN', key: 'capturePause', value: 'false' },
        { type: 'BOOLEAN', key: 'captureProgress', value: 'true' }
      ]
    };
  });

  it('should create a video trigger config correctly', () => {
    const result = service.videoTrigger({
      accountId: 'test-account',
      containerId: 'test-container'
    });

    expect(result).toEqual(mockVideoTriggerConfig);
  });

  it('should create a video trigger when isIncludeVideo returns true', () => {
    jest.spyOn(eventUtils, 'isIncludeVideo').mockReturnValue(true);

    const result = service.createVideoTrigger('test-account', 'test-container');

    expect(result).toEqual([mockVideoTriggerConfig]);
    expect(eventUtils.isIncludeVideo).toHaveBeenCalledWith([]);
  });

  it('should return an empty array when isIncludeVideo returns false', () => {
    jest.spyOn(eventUtils, 'isIncludeVideo').mockReturnValue(false);

    const result = service.createVideoTrigger('test-account', 'test-container');

    expect(result).toEqual([]);
    expect(eventUtils.isIncludeVideo).toHaveBeenCalledWith([]);
  });

  it('should return an empty array and log error when an exception occurs', () => {
    jest.spyOn(eventUtils, 'isIncludeVideo').mockImplementation(() => {
      throw new Error('Test error');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = service.createVideoTrigger('test-account', 'test-container');

    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to create video trigger:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
