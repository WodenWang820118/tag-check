import { TestBed } from '@angular/core/testing';
import { TransformService, ConvertOptions } from './transform.service';
import { ConfigManager } from './managers/config-manager.service';
import { TagManager } from './managers/tag-manager.service';
import { TriggerManager } from './managers/trigger-manager.service';
import { VariableManager } from './managers/variable-manager.service';
import { DataLayerUtils } from '../utils/data-layer-utils.service';
import { UtilsService } from '../utils/utils.service';
import { EventUtils } from '../utils/event-utils.service';
import { ParameterUtils } from './utils/parameter-utils.service';
import { EventTag } from './tags/event-tag.service';
import { GoogleTag } from './tags/google-tag.service';
import { ScrollTag } from './tags/scroll-tag.service';
import { VideoTag } from './tags/video-tag.service';
import { EventTrigger } from './triggers/event-trigger.service';
import { VideoTrigger } from './triggers/video-trigger.service';
import { ScrollTrigger } from './triggers/scroll-trigger.service';
import { DataLayerVariable } from './variables/data-layer-variable.service';
import { ScrollVariable } from './variables/scroll-variable.service';
import { VideoVariable } from './variables/video-variable.service';
import { ConstantVariable } from './variables/constant-variable.service';
import { EventSettingsVariableService } from './variables/event-settings-variable.service';
import type { GTMContainerConfig, StrictDataLayerEvent } from '@utils';

describe('TransformService', () => {
  let service: TransformService;

  const mockGtmConfig: GTMContainerConfig = {
    accountId: '123456',
    containerId: '789012',
    containerName: 'Test Container',
    gtmId: 'GTM-TEST01',
    specs: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TransformService,
        ConfigManager,
        TagManager,
        TriggerManager,
        VariableManager,
        DataLayerUtils,
        UtilsService,
        EventUtils,
        ParameterUtils,
        EventTag,
        GoogleTag,
        ScrollTag,
        VideoTag,
        EventTrigger,
        VideoTrigger,
        ScrollTrigger,
        DataLayerVariable,
        ScrollVariable,
        VideoVariable,
        ConstantVariable,
        EventSettingsVariableService
      ]
    });
    service = TestBed.inject(TransformService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('convert', () => {
    function buildOptions(
      overrides: Partial<ConvertOptions> = {}
    ): ConvertOptions {
      return {
        googleTagName: 'Google Tag',
        measurementId: 'G-ABCDEFGH',
        gtmConfigGenerator: mockGtmConfig,
        isSendingEcommerceData: 'false',
        esvContent: [],
        ...overrides
      };
    }

    it('should produce a valid GTMConfiguration from simple specs', () => {
      const specs: StrictDataLayerEvent[] = [
        { event: 'page_view', page_location: '/home' }
      ];

      const options = buildOptions({
        gtmConfigGenerator: {
          ...mockGtmConfig,
          specs
        }
      } as ConvertOptions);

      const result = service.convert(options);

      expect(result.exportFormatVersion).toBe(2);
      expect(result.exportTime).toBeTruthy();
      expect(result.containerVersion).toBeDefined();
    });

    it('should include variables, builtInVariables, triggers, and tags', () => {
      const specs: StrictDataLayerEvent[] = [
        { event: 'page_view', page_location: '/home' }
      ];

      const options = buildOptions({
        gtmConfigGenerator: {
          ...mockGtmConfig,
          specs
        }
      } as ConvertOptions);

      const result = service.convert(options);

      expect(result.containerVersion.variable.length).toBeGreaterThan(0);
      expect(result.containerVersion.tag.length).toBeGreaterThan(0);
      expect(result.containerVersion.trigger.length).toBeGreaterThan(0);
    });

    it('should set the correct container name and publicId', () => {
      const specs: StrictDataLayerEvent[] = [{ event: 'page_view' }];

      const options = buildOptions({
        gtmConfigGenerator: {
          ...mockGtmConfig,
          specs
        }
      } as ConvertOptions);

      const result = service.convert(options);

      expect(result.containerVersion.container.name).toBe('Test Container');
      expect(result.containerVersion.container.publicId).toBe('GTM-TEST01');
    });

    it('should produce tag configs whose tagIds match their firingTriggerIds linkage', () => {
      const specs: StrictDataLayerEvent[] = [
        { event: 'page_view', page_location: '/home' },
        { event: 'purchase', value: '799', currency: 'TWD' }
      ];

      const options = buildOptions({
        gtmConfigGenerator: {
          ...mockGtmConfig,
          specs
        }
      } as ConvertOptions);

      const result = service.convert(options);

      // Every tag (except the base Google Tag which uses a built-in trigger)
      // should reference trigger IDs that exist in the trigger array
      const triggerIds = new Set(
        result.containerVersion.trigger.map((t) => t.triggerId)
      );

      for (const tag of result.containerVersion.tag) {
        if (tag.firingTriggerId) {
          for (const ftId of tag.firingTriggerId) {
            // The Google Tag uses the hardcoded '2147479553' trigger
            if (ftId === '2147479553') continue;
            expect(triggerIds.has(ftId)).toBe(true);
          }
        }
      }
    });

    it('should create event triggers matching data layer events', () => {
      const specs: StrictDataLayerEvent[] = [
        { event: 'sign_up', method: 'email' }
      ];

      const options = buildOptions({
        gtmConfigGenerator: {
          ...mockGtmConfig,
          specs
        }
      } as ConvertOptions);

      const result = service.convert(options);

      const signUpTrigger = result.containerVersion.trigger.find(
        (t) => t.name === 'event equals sign_up'
      );
      expect(signUpTrigger).toBeTruthy();
      expect(signUpTrigger?.type).toBe('CUSTOM_EVENT');
    });

    it('should create data layer variables for each spec path', () => {
      const specs: StrictDataLayerEvent[] = [
        {
          event: 'page_view',
          page_location: '/home',
          page_title: 'Home Page'
        }
      ];

      const options = buildOptions({
        gtmConfigGenerator: {
          ...mockGtmConfig,
          specs
        }
      } as ConvertOptions);

      const result = service.convert(options);

      const variableNames = result.containerVersion.variable.map((v) => v.name);
      expect(variableNames).toEqual(
        expect.arrayContaining(['DLV - page_location', 'DLV - page_title'])
      );
    });

    it('should include a measurement ID constant variable', () => {
      const specs: StrictDataLayerEvent[] = [{ event: 'page_view' }];

      const options = buildOptions({
        gtmConfigGenerator: {
          ...mockGtmConfig,
          specs
        }
      } as ConvertOptions);

      const result = service.convert(options);

      const constVar = result.containerVersion.variable.find(
        (v) => v.name === 'CONST - Measurement ID'
      );
      expect(constVar).toBeTruthy();
      expect(constVar?.type).toBe('c');
    });

    it('should deduplicate data layer variables shared across events', () => {
      const specs: StrictDataLayerEvent[] = [
        { event: 'page_view', page_location: '/home' },
        { event: 'purchase', page_location: '/checkout', value: '799' }
      ];

      const options = buildOptions({
        gtmConfigGenerator: {
          ...mockGtmConfig,
          specs
        }
      } as ConvertOptions);

      const result = service.convert(options);

      const pageLocationVars = result.containerVersion.variable.filter(
        (v) => v.name === 'DLV - page_location'
      );
      expect(pageLocationVars).toHaveLength(1);
    });

    it('should handle empty specs gracefully', () => {
      const options = buildOptions({
        gtmConfigGenerator: {
          ...mockGtmConfig,
          specs: []
        }
      } as ConvertOptions);

      const result = service.convert(options);

      // Should still produce a valid structure (at least Google Tag + measurement constant)
      expect(result.exportFormatVersion).toBe(2);
      expect(result.containerVersion.variable.length).toBeGreaterThan(0);
      expect(result.containerVersion.tag.length).toBeGreaterThan(0);
    });

    it('should include scroll trigger and tag when specs contain scroll event', () => {
      const specs: StrictDataLayerEvent[] = [
        { event: 'page_view', page_location: '/home' },
        { event: 'scroll' }
      ];

      const options = buildOptions({
        gtmConfigGenerator: {
          ...mockGtmConfig,
          specs
        }
      } as ConvertOptions);

      const result = service.convert(options);

      const triggerNames = result.containerVersion.trigger.map((t) => t.name);
      expect(triggerNames).toEqual(
        expect.arrayContaining(['event scroll'])
      );

      const tagNames = result.containerVersion.tag.map((t) => t.name);
      expect(tagNames).toEqual(
        expect.arrayContaining(['GA4 event - scroll'])
      );
    });

    it('should include video trigger and tags when specs contain video event', () => {
      const specs: StrictDataLayerEvent[] = [
        { event: 'page_view', page_location: '/home' },
        { event: 'video_start' }
      ];

      const options = buildOptions({
        gtmConfigGenerator: {
          ...mockGtmConfig,
          specs
        }
      } as ConvertOptions);

      const result = service.convert(options);

      const triggerNames = result.containerVersion.trigger.map((t) => t.name);
      expect(triggerNames).toEqual(
        expect.arrayContaining(['event youtube video'])
      );

      const tagNames = result.containerVersion.tag.map((t) => t.name);
      expect(tagNames).toEqual(
        expect.arrayContaining(['GA4 event - Video'])
      );
    });

    it('should NOT include scroll/video triggers when specs lack those events', () => {
      const specs: StrictDataLayerEvent[] = [
        { event: 'page_view', page_location: '/home' }
      ];

      const options = buildOptions({
        gtmConfigGenerator: {
          ...mockGtmConfig,
          specs
        }
      } as ConvertOptions);

      const result = service.convert(options);

      const triggerNames = result.containerVersion.trigger.map((t) => t.name);
      expect(triggerNames).not.toEqual(
        expect.arrayContaining(['event scroll', 'event youtube video'])
      );
    });
  });
});
