import {
  BaseDataLayerEvent,
  StrictDataLayerEvent,
  ValidationResult,
} from '@utils';
import { EcommerceEventValidationStrategy } from './ecommerce-event-validation-strategy.service';
import { OldGA4EventsValidationStrategy } from './old-ga4-events-validation-strategy.service';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing/test';
import { STRATEGY_TYPE, ValidationStrategyType } from '../utils';
import { InspectorUtilsService } from '../inspector-utils.service';
import { DataLayerValidationUtilsService } from './data-layer-validation-utils.service';

describe('ValidationStrategy', () => {
  describe('EcommerceEventValidationStrategy', () => {
    let ecommerceEventValidationStrategy: EcommerceEventValidationStrategy;

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        providers: [
          EcommerceEventValidationStrategy,
          {
            provide: STRATEGY_TYPE,
            useFactory: (
              ecommerceEventValidationStrategy: EcommerceEventValidationStrategy,
              oldGA4EventsValidationStrategy: OldGA4EventsValidationStrategy
            ) => {
              return {
                [ValidationStrategyType.ECOMMERCE]:
                  ecommerceEventValidationStrategy,
                [ValidationStrategyType.OLDGA4EVENTS]:
                  oldGA4EventsValidationStrategy,
              };
            },
            inject: [
              EcommerceEventValidationStrategy,
              OldGA4EventsValidationStrategy,
            ],
          },
          InspectorUtilsService,
          DataLayerValidationUtilsService,
        ],
      })
        .useMocker((token) => {
          if (typeof token === 'function') {
            return vi.fn();
          }
        })
        .compile();

      ecommerceEventValidationStrategy =
        moduleRef.get<EcommerceEventValidationStrategy>(
          EcommerceEventValidationStrategy
        );
    });

    describe('validateDataLayer', () => {
      const actualDataLayerObj = {
        event: 'add_to_cart',
        ecommerce: {
          items: [
            {
              item_id: 'SKU_12345',
              item_name: 'Switzerland',
              item_category: 'Europe',
              quantity: 1,
              price: 200,
            },
          ],
          currency: 'USD',
          value: 200,
        },
      };

      // the spec for the dataLayer object
      // it has variables that only need to match the key
      // it has regex for the values matching
      // it has static string or number values which are exactly matching
      const dataLayerSpec = {
        event: 'add_to_cart',
        ecommerce: {
          items: [
            {
              item_id: '$item_id',
              item_name: '^(?:switzerland|california)$',
              item_category: 'Europe',
              quantity: 1,
              price: 200,
            },
          ],
          currency: 'USD',
          value: 200,
        },
      };

      const tests: {
        description: string;
        dataLayer: BaseDataLayerEvent[] | StrictDataLayerEvent[];
        dataLayerSpec: StrictDataLayerEvent;
        expectedResult: ValidationResult;
      }[] = [
        {
          description:
            'should pass for add_to_cart event with all required keys/values',
          dataLayer: [{ ecommerce: null }, actualDataLayerObj],
          dataLayerSpec: dataLayerSpec,
          expectedResult: {
            passed: true,
            message: 'Valid',
            dataLayerSpec: dataLayerSpec,
          },
        },
      ];

      it.each(tests)(
        '$description',
        ({ dataLayer, dataLayerSpec, expectedResult }) => {
          const result = ecommerceEventValidationStrategy.validateDataLayer(
            dataLayer,
            dataLayerSpec
          );
          expect(result.passed).toBe(expectedResult.passed);
          expect(result.message).toBe(expectedResult.message);
        }
      );

      it('should fail if ecommerce is not reset', () => {
        const dataLayer: BaseDataLayerEvent[] | StrictDataLayerEvent[] = [
          {
            event: 'view_item',
            ecommerce: {
              items: [
                {
                  item_id: 'SKU_12345',
                  item_name: 'Laptop',
                },
              ],
            },
          },
          {
            event: 'add_to_cart',
            ecommerce: {
              items: [
                {
                  item_id: 'SKU_12346',
                  item_name: 'Mouse',
                },
              ],
            },
          },
        ];
        const spec: StrictDataLayerEvent = {
          event: 'add_to_cart',
          ecommerce: {
            items: [
              {
                item_id: 'SKU_12346',
                item_name: 'Mouse',
              },
            ],
          },
        };
        const result = ecommerceEventValidationStrategy.validateDataLayer(
          dataLayer,
          spec
        );

        expect(result.passed).toBe(false);
        expect(result.message).toBe(
          `ecommerce must be reset before firing ${spec.event}.`
        );
      });
    });
  });

  describe('OldGA4EventsValidationStrategy', () => {
    let oldGA4EventsValidationStrategy: OldGA4EventsValidationStrategy;

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        providers: [
          OldGA4EventsValidationStrategy,
          {
            provide: STRATEGY_TYPE,
            useFactory: (
              ecommerceEventValidationStrategy: EcommerceEventValidationStrategy,
              oldGA4EventsValidationStrategy: OldGA4EventsValidationStrategy
            ) => {
              return {
                [ValidationStrategyType.ECOMMERCE]:
                  ecommerceEventValidationStrategy,
                [ValidationStrategyType.OLDGA4EVENTS]:
                  oldGA4EventsValidationStrategy,
              };
            },
            inject: [
              EcommerceEventValidationStrategy,
              OldGA4EventsValidationStrategy,
            ],
          },
          InspectorUtilsService,
          DataLayerValidationUtilsService,
        ],
      })
        .useMocker((token) => {
          if (typeof token === 'function') {
            return vi.fn();
          }
        })
        .compile();
      oldGA4EventsValidationStrategy =
        moduleRef.get<OldGA4EventsValidationStrategy>(
          OldGA4EventsValidationStrategy
        );
    });

    it('should pass for generate_lead event with all keys', () => {
      const dataLayer: StrictDataLayerEvent[] = [
        { event: 'generate_lead', value: 10, currency: 'USD' },
      ];
      const spec: StrictDataLayerEvent = {
        event: 'generate_lead',
        value: 10,
        currency: 'USD',
      };
      const result = oldGA4EventsValidationStrategy.validateDataLayer(
        dataLayer,
        spec
      );

      expect(result.passed).toBe(true);
      expect(result.message).toBe('Valid');
    });

    it('should fail for login event without method key', () => {
      const dataLayer: StrictDataLayerEvent[] = [{ event: 'login' }];
      const spec: StrictDataLayerEvent = { event: 'login', method: 'Google' };
      const result = oldGA4EventsValidationStrategy.validateDataLayer(
        dataLayer,
        spec
      );

      expect(result.passed).toBe(false);
      expect(result.message).toBe(
        `Key "method" is not present in the dataLayer`
      );
    });
  });
});
