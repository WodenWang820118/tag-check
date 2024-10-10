import { TestBed } from '@angular/core/testing';
import { EventUtils } from './event-utils.service';

describe('EventUtils', () => {
  let service: EventUtils;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EventUtils],
    });
    service = TestBed.inject(EventUtils);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isBuiltInEvent', () => {
    it('should return true for a built-in event', () => {
      expect(service.isBuiltInEvent('video_start')).toBe(true);
      expect(service.isBuiltInEvent('video_progress')).toBe(true);
    });

    it('should return false for a non-built-in event', () => {
      expect(service.isBuiltInEvent('custom_event')).toBe(false);
    });
  });

  describe('isIncludeVideo', () => {
    it('should return true if data includes a video event', () => {
      const data = [
        { eventName: 'video_start', formattedParameters: [] },
        { eventName: 'custom_event', formattedParameters: [] },
      ];
      expect(service.isIncludeVideo(data)).toBe(true);
    });

    it('should return false if data does not include a video event', () => {
      const data = [
        { eventName: 'custom_event1', formattedParameters: [] },
        { eventName: 'custom_event2', formattedParameters: [] },
      ];
      expect(service.isIncludeVideo(data)).toBe(false);
    });
  });

  describe('isIncludeScroll', () => {
    it('should return true if data includes a scroll event', () => {
      const data = [
        { eventName: 'scroll', formattedParameters: [] },
        { eventName: 'custom_event', formattedParameters: [] },
      ];
      expect(service.isIncludeScroll(data)).toBe(true);
    });

    it('should return false if data does not include a scroll event', () => {
      const data = [
        { eventName: 'custom_event1', formattedParameters: [] },
        { eventName: 'custom_event2', formattedParameters: [] },
      ];
      expect(service.isIncludeScroll(data)).toBe(false);
    });
  });
});
