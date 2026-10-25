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
import {
  getGa4EventParameterRows,
  isStrictDataLayerEvent,
  measurementPlanToDataLayerSpecs,
  resolveVariableReference,
  validateGTMImportReadiness,
  type GTMContainerConfig,
  type MeasurementPlanRow,
  type StrictDataLayerEvent
} from '@utils';

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
      });

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
      expect(triggerNames).toEqual(expect.arrayContaining(['event scroll']));

      const tagNames = result.containerVersion.tag.map((t) => t.name);
      expect(tagNames).toEqual(expect.arrayContaining(['GA4 event - scroll']));
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
      expect(tagNames).toEqual(expect.arrayContaining(['GA4 event - Video']));
    });

    it('fires the scroll tag on the Scroll Depth trigger, with no custom scroll event tag', () => {
      const result = service.convert(
        buildOptions({
          gtmConfigGenerator: {
            ...mockGtmConfig,
            specs: [{ event: 'page_view' }, { event: 'scroll' }]
          }
        })
      );
      const { tag, trigger } = result.containerVersion;

      const scrollTags = tag.filter((t) => t.name === 'GA4 event - scroll');
      expect(scrollTags).toHaveLength(1);
      const firing = trigger.filter((t) =>
        scrollTags[0].firingTriggerId?.includes(t.triggerId ?? '')
      );
      expect(firing.map((t) => t.type)).toEqual(['SCROLL_DEPTH']);
      expect(trigger.map((t) => t.name)).not.toContain('event equals scroll');
    });

    it('fires the video tags on the YouTube Video trigger with a defined measurement ID', () => {
      const result = service.convert(
        buildOptions({
          gtmConfigGenerator: {
            ...mockGtmConfig,
            specs: [{ event: 'video_start' }, { event: 'video_complete' }]
          }
        })
      );
      const { tag, trigger, variable } = result.containerVersion;

      const videoTag = tag.find((t) => t.name === 'GA4 event - Video');
      const firing = trigger.filter((t) =>
        videoTag?.firingTriggerId?.includes(t.triggerId ?? '')
      );
      expect(firing.map((t) => t.type)).toEqual(['YOU_TUBE_VIDEO']);
      expect(tag.map((t) => t.name)).not.toContain('GA4 event - video_start');

      const measurementId = videoTag?.parameter.find(
        (p) => p.key === 'measurementIdOverride'
      )?.value;
      expect(variable.map((v) => `{{${v.name}}}`)).toContain(measurementId);
    });

    it('creates one trigger and one tag for an event that several specs push', () => {
      const result = service.convert(
        buildOptions({
          gtmConfigGenerator: {
            ...mockGtmConfig,
            specs: [
              { event: 'login', method: '$method' },
              { event: 'login', user_type: '$user_type' }
            ]
          }
        })
      );
      const { tag, trigger } = result.containerVersion;

      expect(trigger.map((t) => t.name)).toEqual(['event equals login']);
      const loginTags = tag.filter((t) => t.name === 'GA4 event - login');
      expect(loginTags).toHaveLength(1);
      expect(
        getGa4EventParameterRows(loginTags[0], []).map((row) => row.parameter)
      ).toEqual(['method', 'user_type']);
    });

    it('sends a nested spec key under a GA4-valid name that reads its dotted path', () => {
      // Specs are parsed from the JSON the user types, which may nest any
      // object, while StrictDataLayerEvent only types `ecommerce` objects.
      const spec: unknown = { event: 'login', user: { id: '$user_id' } };
      if (!isStrictDataLayerEvent(spec)) {
        throw new Error('expected a dataLayer spec');
      }
      const result = service.convert(
        buildOptions({
          gtmConfigGenerator: { ...mockGtmConfig, specs: [spec] }
        })
      );
      const { tag, variable } = result.containerVersion;
      const loginTag = tag.find((t) => t.name === 'GA4 event - login');
      const rows = loginTag ? getGa4EventParameterRows(loginTag, variable) : [];

      expect(rows).toContainEqual({
        parameter: 'user_id',
        value: '{{DLV - user.id}}'
      });
      expect(resolveVariableReference('{{DLV - user.id}}', variable)).toEqual({
        kind: 'dataLayer',
        path: 'user.id'
      });
      expect(
        validateGTMImportReadiness(result).warnings.filter((warning) =>
          warning.includes('event parameter')
        )
      ).toEqual([]);
    });

    it('gives every tag and trigger a unique name', () => {
      const result = service.convert(
        buildOptions({
          gtmConfigGenerator: {
            ...mockGtmConfig,
            specs: [
              { event: 'page_view' },
              { event: 'scroll' },
              { event: 'video_start' },
              { event: 'page_view' }
            ]
          }
        })
      );
      const tagNames = result.containerVersion.tag.map((t) => t.name);
      const triggerNames = result.containerVersion.trigger.map((t) => t.name);

      expect(new Set(tagNames).size).toBe(tagNames.length);
      expect(new Set(triggerNames).size).toBe(triggerNames.length);
    });

    it('keeps top-level parameters whose name contains "ecommerce"', () => {
      const result = service.convert(
        buildOptions({
          gtmConfigGenerator: {
            ...mockGtmConfig,
            specs: [{ event: 'page_view', ecommerce_platform: '$platform' }]
          }
        })
      );
      const pageView = result.containerVersion.tag.find(
        (t) => t.name === 'GA4 event - page_view'
      );

      expect(pageView ? getGa4EventParameterRows(pageView, []) : []).toEqual([
        {
          parameter: 'ecommerce_platform',
          value: '{{DLV - ecommerce_platform}}'
        }
      ]);
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

    describe('measurement plan round-trip', () => {
      const planRows: MeasurementPlanRow[] = [
        {
          eventName: 'add_to_cart',
          eventParameters: ['currency', 'value'],
          itemParameters: ['item_id', 'item_name', 'price']
        },
        {
          eventName: 'sign_up',
          eventParameters: ['method'],
          itemParameters: []
        }
      ];

      it('round-trips plan rows to specs and verifies getGa4EventParameterRows with sendEcommerceData="false"', () => {
        const specs = measurementPlanToDataLayerSpecs(planRows);
        const options = buildOptions({
          gtmConfigGenerator: {
            ...mockGtmConfig,
            specs
          },
          isSendingEcommerceData: 'false'
        });

        const result = service.convert(options);
        const tags = result.containerVersion.tag;
        const variables = result.containerVersion.variable;

        const addToCartTag = tags.find(
          (t) => t.name === 'GA4 event - add_to_cart'
        );
        const signUpTag = tags.find((t) => t.name === 'GA4 event - sign_up');

        expect(addToCartTag).toBeDefined();
        expect(signUpTag).toBeDefined();

        if (addToCartTag) {
          const addToCartRows = getGa4EventParameterRows(
            addToCartTag,
            variables
          );
          const params = addToCartRows.map((r) => r.parameter);
          expect(params).toContain('currency');
          expect(params).toContain('value');
          expect(addToCartRows).toEqual(
            expect.arrayContaining([
              { parameter: 'currency', value: '{{DLV - ecommerce.currency}}' },
              { parameter: 'value', value: '{{DLV - ecommerce.value}}' }
            ])
          );
        }

        if (signUpTag) {
          const signUpRows = getGa4EventParameterRows(signUpTag, variables);
          expect(signUpRows).toEqual([
            { parameter: 'method', value: '{{DLV - method}}' }
          ]);
        }
      });

      it('round-trips plan rows with sendEcommerceData="true" where ecommerce parameters are omitted', () => {
        const specs = measurementPlanToDataLayerSpecs(planRows);
        const options = buildOptions({
          gtmConfigGenerator: {
            ...mockGtmConfig,
            specs
          },
          isSendingEcommerceData: 'true'
        });

        const result = service.convert(options);
        const tags = result.containerVersion.tag;
        const variables = result.containerVersion.variable;

        const addToCartTag = tags.find(
          (t) => t.name === 'GA4 event - add_to_cart'
        );
        const signUpTag = tags.find((t) => t.name === 'GA4 event - sign_up');

        expect(addToCartTag).toBeDefined();
        expect(signUpTag).toBeDefined();

        if (addToCartTag) {
          // When sendEcommerceData is true, parameters whose values mention ecommerce are omitted
          const addToCartRows = getGa4EventParameterRows(
            addToCartTag,
            variables
          );
          expect(addToCartRows).toEqual([]);
        }

        if (signUpTag) {
          const signUpRows = getGa4EventParameterRows(signUpTag, variables);
          expect(signUpRows).toEqual([
            { parameter: 'method', value: '{{DLV - method}}' }
          ]);
        }
      });
    });
  });
});
