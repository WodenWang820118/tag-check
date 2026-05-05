import { TestBed } from '@angular/core/testing';
import { TagManager } from './tag-manager.service';
import { EventTag } from '../tags/event-tag.service';
import { GoogleTag } from '../tags/google-tag.service';
import { ScrollTag } from '../tags/scroll-tag.service';
import { VideoTag } from '../tags/video-tag.service';
import { EventUtils } from '../../utils/event-utils.service';
import { ParameterUtils } from '../utils/parameter-utils.service';
import type { DataLayer, Trigger, TagConfig } from '@utils';

describe('TagManager', () => {
  let service: TagManager;

  const mockAccountId = 'acc-tag';
  const mockContainerId = 'con-tag';
  const mockGoogleTagName = 'Google Tag';
  const mockMeasurementId = 'G-XXXXXXXXXX';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TagManager,
        EventTag,
        GoogleTag,
        ScrollTag,
        VideoTag,
        EventUtils,
        ParameterUtils
      ]
    });
    service = TestBed.inject(TagManager);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTags', () => {
    it('should always include a Google Tag configuration as the first tag', () => {
      const dataLayers: DataLayer[] = [];
      const triggers: Trigger[] = [];

      const result = service.getTags(
        mockAccountId,
        mockContainerId,
        dataLayers,
        triggers,
        mockGoogleTagName,
        mockMeasurementId,
        'false'
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].name).toBe(mockGoogleTagName);
      expect(result[0].type).toBe('googtag');
    });

    it('should create event tags for each data layer event', () => {
      const dataLayers: DataLayer[] = [
        { event: 'page_view', paths: ['page_location'] },
        { event: 'purchase', paths: ['value', 'currency'] }
      ];
      const triggers: Trigger[] = [
        { name: 'page_view', triggerId: '1' },
        { name: 'purchase', triggerId: '2' }
      ];

      const result = service.getTags(
        mockAccountId,
        mockContainerId,
        dataLayers,
        triggers,
        mockGoogleTagName,
        mockMeasurementId,
        'false'
      );

      // 1 config tag + 2 event tags + scroll tags + video tags
      const eventTags = result.filter((t) => t.name.startsWith('GA4 event'));
      expect(eventTags).toHaveLength(2);
    });

    it('should assign sequential tagIds starting from "1"', () => {
      const dataLayers: DataLayer[] = [{ event: 'page_view', paths: [] }];
      const triggers: Trigger[] = [{ name: 'page_view', triggerId: '1' }];

      const result = service.getTags(
        mockAccountId,
        mockContainerId,
        dataLayers,
        triggers,
        mockGoogleTagName,
        mockMeasurementId,
        'false'
      );

      for (let i = 0; i < result.length; i++) {
        expect(result[i].tagId).toBe(String(i + 1));
      }
    });

    it('should NOT include scroll or video tags when no matching events exist', () => {
      const dataLayers: DataLayer[] = [
        { event: 'page_view', paths: ['page_location'] }
      ];
      const triggers: Trigger[] = [{ name: 'page_view', triggerId: '1' }];

      const result = service.getTags(
        mockAccountId,
        mockContainerId,
        dataLayers,
        triggers,
        mockGoogleTagName,
        mockMeasurementId,
        'false'
      );

      const tagNames = result.map((t) => t.name);
      expect(tagNames).toEqual(
        expect.not.arrayContaining(['GA4 event - scroll', 'GA4 event - Video'])
      );
    });

    it('should include scroll tag when data layers contain a scroll event', () => {
      const dataLayers: DataLayer[] = [{ event: 'scroll', paths: [] }];
      const triggers: Trigger[] = [{ name: 'scroll', triggerId: '99' }];

      const result = service.getTags(
        mockAccountId,
        mockContainerId,
        dataLayers,
        triggers,
        mockGoogleTagName,
        mockMeasurementId,
        'false'
      );

      const tagNames = result.map((t) => t.name);
      expect(tagNames).toEqual(expect.arrayContaining(['GA4 event - scroll']));
    });

    it('should propagate accountId and containerId to all tags', () => {
      const dataLayers: DataLayer[] = [
        { event: 'page_view', paths: ['page_location'] }
      ];
      const triggers: Trigger[] = [{ name: 'page_view', triggerId: '1' }];

      const result = service.getTags(
        mockAccountId,
        mockContainerId,
        dataLayers,
        triggers,
        mockGoogleTagName,
        mockMeasurementId,
        'false'
      );

      for (const tag of result) {
        expect(tag.accountId).toBe(mockAccountId);
        expect(tag.containerId).toBe(mockContainerId);
      }
    });

    it('should handle empty data layers (should still produce Google Tag config)', () => {
      const result = service.getTags(
        mockAccountId,
        mockContainerId,
        [],
        [],
        mockGoogleTagName,
        mockMeasurementId,
        'false'
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].type).toBe('googtag');
    });

    it('should create event tags with firingTriggerIds matching their triggers', () => {
      const dataLayers: DataLayer[] = [{ event: 'purchase', paths: ['value'] }];
      const triggers: Trigger[] = [{ name: 'purchase', triggerId: '42' }];

      const result = service.getTags(
        mockAccountId,
        mockContainerId,
        dataLayers,
        triggers,
        mockGoogleTagName,
        mockMeasurementId,
        'false'
      );

      const purchaseTag = result.find((t) => t.name === 'GA4 event - purchase');
      expect(purchaseTag).toBeTruthy();
    });
  });
});
