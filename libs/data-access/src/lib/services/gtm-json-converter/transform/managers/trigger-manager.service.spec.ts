import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { TriggerManager } from './trigger-manager.service';
import { EventTrigger } from '../triggers/event-trigger.service';
import { VideoTrigger } from '../triggers/video-trigger.service';
import { ScrollTrigger } from '../triggers/scroll-trigger.service';
import { EventUtils } from '../../utils/event-utils.service';
import { ParameterUtils } from '../utils/parameter-utils.service';
import { TagManager } from './tag-manager.service';
import { GoogleTag } from '../tags/google-tag.service';
import { EventTag } from '../tags/event-tag.service';
import { ScrollTag } from '../tags/scroll-tag.service';
import { VideoTag } from '../tags/video-tag.service';
import type { DataLayer } from '@utils';

describe('TriggerManager', () => {
  let service: TriggerManager;
  let videoTrigger: VideoTrigger;
  let scrollTrigger: ScrollTrigger;
  let tagManager: TagManager;

  const mockAccountId = 'acc-trigger';
  const mockContainerId = 'con-trigger';
  const mockGoogleTagName = 'Google Tag';
  const mockMeasurementId = 'G-XXXXXXXXXX';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TriggerManager,
        EventTrigger,
        VideoTrigger,
        ScrollTrigger,
        EventUtils,
        ParameterUtils,
        TagManager,
        GoogleTag,
        EventTag,
        ScrollTag,
        VideoTag
      ]
    });
    service = TestBed.inject(TriggerManager);
    videoTrigger = TestBed.inject(VideoTrigger);
    scrollTrigger = TestBed.inject(ScrollTrigger);
    tagManager = TestBed.inject(TagManager);
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  describe('trigger contribution ordering and references', () => {
    it('should return empty references and configs for empty input', () => {
      const dataLayers: DataLayer[] = [];

      const references = service.createTriggers(dataLayers);
      const configs = service.getTriggers(
        mockAccountId,
        mockContainerId,
        dataLayers
      );
      const tags = tagManager.getTags(
        mockAccountId,
        mockContainerId,
        dataLayers,
        references,
        mockGoogleTagName,
        mockMeasurementId,
        'false'
      );

      expect(references).toEqual([]);
      expect(configs).toEqual([]);
      expect(tags).toHaveLength(1);
      expect(tags[0].name).toBe(mockGoogleTagName);
      expect(tags[0].firingTriggerId).toEqual(['2147479553']);
    });

    it('should order references, configs and tags for custom events', () => {
      const dataLayers: DataLayer[] = [
        { event: 'page_view', paths: ['page_path'] },
        { event: 'purchase', paths: ['value'] }
      ];

      const references = service.createTriggers(dataLayers);
      const configs = service.getTriggers(
        mockAccountId,
        mockContainerId,
        dataLayers
      );
      const tags = tagManager.getTags(
        mockAccountId,
        mockContainerId,
        dataLayers,
        references,
        mockGoogleTagName,
        mockMeasurementId,
        'false'
      );

      expect(references).toEqual([
        { name: 'page_view', triggerId: '1' },
        { name: 'purchase', triggerId: '2' }
      ]);
      expect(
        configs.map((c) => ({ name: c.name, triggerId: c.triggerId }))
      ).toEqual([
        { name: 'event equals page_view', triggerId: '1' },
        { name: 'event equals purchase', triggerId: '2' }
      ]);
      expect(configs.map((c) => c.type)).toEqual([
        'CUSTOM_EVENT',
        'CUSTOM_EVENT'
      ]);

      const pageViewTag = tags.find((t) => t.name === 'GA4 event - page_view');
      const purchaseTag = tags.find((t) => t.name === 'GA4 event - purchase');
      expect(pageViewTag?.firingTriggerId).toEqual(['1']);
      expect(purchaseTag?.firingTriggerId).toEqual(['2']);
    });

    it('should order references, configs and tags for video events', () => {
      const dataLayers: DataLayer[] = [{ event: 'video_start', paths: [] }];

      const references = service.createTriggers(dataLayers);
      const configs = service.getTriggers(
        mockAccountId,
        mockContainerId,
        dataLayers
      );
      const tags = tagManager.getTags(
        mockAccountId,
        mockContainerId,
        dataLayers,
        references,
        mockGoogleTagName,
        mockMeasurementId,
        'false'
      );

      expect(references).toEqual([
        { name: 'event youtube video', triggerId: '1' }
      ]);
      expect(
        configs.map((c) => ({ name: c.name, triggerId: c.triggerId }))
      ).toEqual([{ name: 'event youtube video', triggerId: '1' }]);
      expect(configs.map((c) => c.type)).toEqual(['YOU_TUBE_VIDEO']);

      const videoEventTag = tags.find((t) => t.name === 'GA4 event - Video');
      const videoHtmlTag = tags.find(
        (t) => t.name === 'cHTML - Youtube iframe API script'
      );
      expect(videoEventTag?.firingTriggerId).toEqual(['1']);
      expect(videoHtmlTag?.firingTriggerId).toEqual(['1']);
    });

    it('should order references, configs and tags for scroll events', () => {
      const dataLayers: DataLayer[] = [{ event: 'scroll', paths: [] }];

      const references = service.createTriggers(dataLayers);
      const configs = service.getTriggers(
        mockAccountId,
        mockContainerId,
        dataLayers
      );
      const tags = tagManager.getTags(
        mockAccountId,
        mockContainerId,
        dataLayers,
        references,
        mockGoogleTagName,
        mockMeasurementId,
        'false'
      );

      expect(references).toEqual([{ name: 'event scroll', triggerId: '1' }]);
      expect(
        configs.map((c) => ({ name: c.name, triggerId: c.triggerId }))
      ).toEqual([{ name: 'event scroll', triggerId: '1' }]);
      expect(configs.map((c) => c.type)).toEqual(['SCROLL_DEPTH']);

      const scrollTag = tags.find((t) => t.name === 'GA4 event - scroll');
      expect(scrollTag?.firingTriggerId).toEqual(['1']);
    });

    it('orders mixed inputs and handles repeated built-in events', () => {
      const dataLayers: DataLayer[] = [
        { event: 'scroll', paths: [] },
        { event: 'sign_up', paths: [] },
        { event: 'video_start', paths: [] },
        { event: 'video_progress', paths: [] },
        { event: 'scroll', paths: [] },
        { event: 'video_complete', paths: [] },
        { event: 'purchase', paths: [] }
      ];

      const references = service.createTriggers(dataLayers);
      const configs = service.getTriggers(
        mockAccountId,
        mockContainerId,
        dataLayers
      );
      const tags = tagManager.getTags(
        mockAccountId,
        mockContainerId,
        dataLayers,
        references,
        mockGoogleTagName,
        mockMeasurementId,
        'false'
      );

      expect(references).toEqual([
        { name: 'sign_up', triggerId: '1' },
        { name: 'purchase', triggerId: '2' },
        { name: 'event youtube video', triggerId: '3' },
        { name: 'event scroll', triggerId: '4' }
      ]);

      expect(
        configs.map((c) => ({ name: c.name, triggerId: c.triggerId }))
      ).toEqual([
        { name: 'event equals sign_up', triggerId: '1' },
        { name: 'event equals purchase', triggerId: '2' },
        { name: 'event youtube video', triggerId: '3' },
        { name: 'event scroll', triggerId: '4' }
      ]);

      expect(configs.map((c) => c.type)).toEqual([
        'CUSTOM_EVENT',
        'CUSTOM_EVENT',
        'YOU_TUBE_VIDEO',
        'SCROLL_DEPTH'
      ]);

      const signUpTag = tags.find((t) => t.name === 'GA4 event - sign_up');
      const purchaseTag = tags.find((t) => t.name === 'GA4 event - purchase');
      const videoEventTag = tags.find((t) => t.name === 'GA4 event - Video');
      const videoHtmlTag = tags.find(
        (t) => t.name === 'cHTML - Youtube iframe API script'
      );
      const scrollTag = tags.find((t) => t.name === 'GA4 event - scroll');

      expect(signUpTag?.firingTriggerId).toEqual(['1']);
      expect(purchaseTag?.firingTriggerId).toEqual(['2']);
      expect(videoEventTag?.firingTriggerId).toEqual(['3']);
      expect(videoHtmlTag?.firingTriggerId).toEqual(['3']);
      expect(scrollTag?.firingTriggerId).toEqual(['4']);
    });

    it('retains video reference name when video builder returns []', () => {
      vi.spyOn(videoTrigger, 'createVideoTrigger').mockReturnValue([]);

      const dataLayers: DataLayer[] = [
        { event: 'page_view', paths: [] },
        { event: 'video_start', paths: [] }
      ];

      const references = service.createTriggers(dataLayers);
      const configs = service.getTriggers(
        mockAccountId,
        mockContainerId,
        dataLayers
      );

      expect(references).toEqual([
        { name: 'page_view', triggerId: '1' },
        { name: 'event youtube video', triggerId: '2' }
      ]);
      expect(configs).toHaveLength(1);
      expect(configs[0].name).toBe('event equals page_view');
      expect(configs[0].triggerId).toBe('1');
    });

    it('retains scroll reference name when scroll builder returns []', () => {
      vi.spyOn(scrollTrigger, 'createScrollTrigger').mockReturnValue([]);

      const dataLayers: DataLayer[] = [
        { event: 'page_view', paths: [] },
        { event: 'scroll', paths: [] }
      ];

      const references = service.createTriggers(dataLayers);
      const configs = service.getTriggers(
        mockAccountId,
        mockContainerId,
        dataLayers
      );

      expect(references).toEqual([
        { name: 'page_view', triggerId: '1' },
        { name: 'event scroll', triggerId: '2' }
      ]);
      expect(configs).toHaveLength(1);
      expect(configs[0].name).toBe('event equals page_view');
      expect(configs[0].triggerId).toBe('1');
    });
  });
});
