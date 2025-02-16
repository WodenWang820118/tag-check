import { TestBed } from '@angular/core/testing';
import { ScrollTrigger } from './scroll-trigger.service';
import { ParameterUtils } from '../utils/parameter-utils.service';
import { EventUtils } from '../../utils/event-utils.service';
import { ScrollDepthTriggerConfig, TriggerTypeEnum } from '@utils';

describe('scrollTrigger', () => {
  let service: ScrollTrigger;
  let parameterUtils: ParameterUtils;
  let eventUtils: EventUtils;
  let mockScrollTriggerConfig: ScrollDepthTriggerConfig;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ScrollTrigger, ParameterUtils, EventUtils]
    });

    service = TestBed.inject(ScrollTrigger);
    parameterUtils = TestBed.inject(ParameterUtils);
    eventUtils = TestBed.inject(EventUtils);

    mockScrollTriggerConfig = {
      accountId: 'test-account',
      containerId: 'test-container',
      name: 'event scroll',
      type: TriggerTypeEnum.SCROLL_DEPTH,
      fingerprint: '1687976535532',
      parameter: [
        { type: 'TEMPLATE', key: 'verticalThresholdUnits', value: 'PERCENT' },
        {
          type: 'TEMPLATE',
          key: 'verticalThresholdsPercent',
          value: '25,50,75,90'
        },
        { type: 'BOOLEAN', key: 'verticalThresholdOn', value: 'true' },
        { type: 'TEMPLATE', key: 'triggerStartOption', value: 'WINDOW_LOAD' },
        { type: 'BOOLEAN', key: 'horizontalThresholdOn', value: 'false' }
      ]
    };
  });

  it('should create a scroll trigger config correctly', () => {
    const result = service.scrollTriggers({
      accountId: 'test-account',
      containerId: 'test-container'
    });

    expect(result).toEqual(mockScrollTriggerConfig);
  });

  it('should create a scroll trigger when isIncludeScroll returns true', () => {
    jest.spyOn(eventUtils, 'isIncludeScroll').mockReturnValue(true);

    const result = service.createScrollTrigger(
      'test-account',
      'test-container'
    );

    expect(result).toEqual([mockScrollTriggerConfig]);
  });

  it('should return an empty array when isIncludeScroll returns false', () => {
    jest.spyOn(eventUtils, 'isIncludeScroll').mockReturnValue(false);

    const result = service.createScrollTrigger(
      'test-account',
      'test-container'
    );

    expect(result).toEqual([]);
  });

  it('should return an empty array and log error when an exception occurs', () => {
    jest.spyOn(eventUtils, 'isIncludeScroll').mockImplementation(() => {
      throw new Error('Test error');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = service.createScrollTrigger(
      'test-account',
      'test-container'
    );

    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to create scroll trigger:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
