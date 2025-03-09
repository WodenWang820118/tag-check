import { TestBed } from '@angular/core/testing';
import { EventUtils } from './event-utils.service';
import { DataLayer } from '@utils';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('EventUtils', () => {
  let service: EventUtils;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EventUtils]
    });
    service = TestBed.inject(EventUtils);
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Changed from jest.restoreAllMocks()
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
      const dataLayers: DataLayer[] = [
        { event: 'video_start', paths: [] },
        { event: 'custom_event', paths: [] }
      ];
      expect(service.isIncludeVideo(dataLayers)).toBe(true);
    });

    it('should return false if data does not include a video event', () => {
      const dataLayers: DataLayer[] = [
        { event: 'custom_event1', paths: [] },
        { event: 'custom_event2', paths: [] }
      ];
      expect(service.isIncludeVideo(dataLayers)).toBe(false);
    });
  });

  describe('isIncludeScroll', () => {
    it('should return true if data includes a scroll event', () => {
      const dataLayers: DataLayer[] = [
        { event: 'scroll', paths: [] },
        { event: 'custom_event', paths: [] }
      ];
      expect(service.isIncludeScroll(dataLayers)).toBe(true);
    });

    it('should return false if data does not include a scroll event', () => {
      const dataLayers: DataLayer[] = [
        { event: 'custom_event1', paths: [] },
        { event: 'custom_event2', paths: [] }
      ];
      expect(service.isIncludeScroll(dataLayers)).toBe(false);
    });
  });
});
