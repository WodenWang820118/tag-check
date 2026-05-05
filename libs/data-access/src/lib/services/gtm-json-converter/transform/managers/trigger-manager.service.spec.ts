import { TestBed } from '@angular/core/testing';
import { TriggerManager } from './trigger-manager.service';
import { EventTrigger } from '../triggers/event-trigger.service';
import { VideoTrigger } from '../triggers/video-trigger.service';
import { ScrollTrigger } from '../triggers/scroll-trigger.service';
import { EventUtils } from '../../utils/event-utils.service';
import { ParameterUtils } from '../utils/parameter-utils.service';
import type { DataLayer, Trigger } from '@utils';

describe('TriggerManager', () => {
  let service: TriggerManager;

  const mockAccountId = 'acc-trigger';
  const mockContainerId = 'con-trigger';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TriggerManager,
        EventTrigger,
        VideoTrigger,
        ScrollTrigger,
        EventUtils,
        ParameterUtils
      ]
    });
    service = TestBed.inject(TriggerManager);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createTriggers', () => {
    it('should create simple triggers with names matching event names', () => {
      const dataLayers: DataLayer[] = [
        { event: 'page_view', paths: [] },
        { event: 'purchase', paths: ['value'] }
      ];

      const result = service.createTriggers(dataLayers);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('page_view');
      expect(result[1].name).toBe('purchase');
    });

    it('should assign sequential triggerIds starting from "1"', () => {
      const dataLayers: DataLayer[] = [
        { event: 'page_view', paths: [] },
        { event: 'purchase', paths: [] }
      ];

      const result = service.createTriggers(dataLayers);

      expect(result[0].triggerId).toBe('1');
      expect(result[1].triggerId).toBe('2');
    });

    it('should return empty array for empty data layers', () => {
      const result = service.createTriggers([]);
      expect(result).toEqual([]);
    });

    it('should create triggers with both name and triggerId properties', () => {
      const dataLayers: DataLayer[] = [{ event: 'sign_up', paths: [] }];

      const result = service.createTriggers(dataLayers);

      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('triggerId');
      expect(result[0].name).toBe('sign_up');
      expect(typeof result[0].triggerId).toBe('string');
    });
  });

  describe('getTriggers', () => {
    it('should create event trigger configs for each data layer event', () => {
      const dataLayers: DataLayer[] = [{ event: 'page_view', paths: [] }];

      const result = service.getTriggers(
        mockAccountId,
        mockContainerId,
        dataLayers
      );

      expect(result.length).toBeGreaterThanOrEqual(1);
      const eventTrigger = result.find(
        (t) => t.name === 'event equals page_view'
      );
      expect(eventTrigger).toBeTruthy();
      expect(eventTrigger?.type).toBe('CUSTOM_EVENT');
    });

    it('should NOT include scroll/video triggers when no matching data layers exist', () => {
      const dataLayers: DataLayer[] = [{ event: 'page_view', paths: [] }];

      const result = service.getTriggers(
        mockAccountId,
        mockContainerId,
        dataLayers
      );

      const names = result.map((t) => t.name);
      expect(names).toEqual(['event equals page_view']);
    });

    it('should include scroll trigger when data layers contain a scroll event', () => {
      const dataLayers: DataLayer[] = [
        { event: 'page_view', paths: [] },
        { event: 'scroll', paths: [] }
      ];

      const result = service.getTriggers(
        mockAccountId,
        mockContainerId,
        dataLayers
      );

      const names = result.map((t) => t.name);
      expect(names).toEqual(
        expect.arrayContaining(['event equals page_view', 'event scroll'])
      );
    });

    it('should include video trigger when data layers contain a video event', () => {
      const dataLayers: DataLayer[] = [
        { event: 'page_view', paths: [] },
        { event: 'video_start', paths: [] }
      ];

      const result = service.getTriggers(
        mockAccountId,
        mockContainerId,
        dataLayers
      );

      const names = result.map((t) => t.name);
      expect(names).toEqual(
        expect.arrayContaining([
          'event equals page_view',
          'event youtube video'
        ])
      );
    });

    it('should assign sequential triggerIds to all trigger configs', () => {
      const dataLayers: DataLayer[] = [{ event: 'page_view', paths: [] }];

      const result = service.getTriggers(
        mockAccountId,
        mockContainerId,
        dataLayers
      );

      for (let i = 0; i < result.length; i++) {
        expect(result[i].triggerId).toBe(String(i + 1));
      }
    });

    it('should propagate accountId and containerId to all trigger configs', () => {
      const dataLayers: DataLayer[] = [{ event: 'page_view', paths: [] }];

      const result = service.getTriggers(
        mockAccountId,
        mockContainerId,
        dataLayers
      );

      for (const trigger of result) {
        expect(trigger.accountId).toBe(mockAccountId);
        expect(trigger.containerId).toBe(mockContainerId);
      }
    });

    it('should handle multiple data layer events with correct trigger count', () => {
      const dataLayers: DataLayer[] = [
        { event: 'page_view', paths: [] },
        { event: 'purchase', paths: [] },
        { event: 'sign_up', paths: [] }
      ];

      const result = service.getTriggers(
        mockAccountId,
        mockContainerId,
        dataLayers
      );

      // 3 event triggers (no scroll/video events in data layers)
      expect(result).toHaveLength(3);
    });

    it('should produce trigger configs with customEventFilter for event triggers', () => {
      const dataLayers: DataLayer[] = [{ event: 'purchase', paths: [] }];

      const result = service.getTriggers(
        mockAccountId,
        mockContainerId,
        dataLayers
      );

      const eventTrigger = result.find(
        (t) => t.name === 'event equals purchase'
      );
      expect(eventTrigger?.customEventFilter).toBeDefined();
      expect(eventTrigger?.customEventFilter).toHaveLength(1);
      expect(eventTrigger?.customEventFilter?.[0].type).toBe('EQUALS');
    });
  });
});
