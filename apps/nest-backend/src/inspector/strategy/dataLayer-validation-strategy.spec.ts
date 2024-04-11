import {
  BaseDataLayerEvent,
  StrictDataLayerEvent,
  ValidationResult,
  ValidationStrategy,
} from '@utils';
import {
  EcommerceEventValidationStrategy,
  OldGA4EventsValidationStrategy,
} from './dataLayer-validation-strategy';

describe('ValidationStrategy', () => {
  describe('EcommerceEventValidationStrategy', () => {
    let strategy: ValidationStrategy;

    beforeEach(() => {
      strategy = new EcommerceEventValidationStrategy();
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
          const result = strategy.validateDataLayer(dataLayer, dataLayerSpec);
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
        const result = strategy.validateDataLayer(dataLayer, spec);

        expect(result.passed).toBe(false);
        expect(result.message).toBe(
          `ecommerce must be reset before firing ${spec.event}.`
        );
      });
    });
  });

  describe('OldGA4EventsValidationStrategy', () => {
    let strategy: ValidationStrategy;

    beforeEach(() => {
      strategy = new OldGA4EventsValidationStrategy();
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
      const result = strategy.validateDataLayer(dataLayer, spec);

      expect(result.passed).toBe(true);
      expect(result.message).toBe('Valid');
    });

    it('should fail for login event without method key', () => {
      const dataLayer: StrictDataLayerEvent[] = [{ event: 'login' }];
      const spec: StrictDataLayerEvent = { event: 'login', method: 'Google' };
      const result = strategy.validateDataLayer(dataLayer, spec);

      expect(result.passed).toBe(false);
      expect(result.message).toBe(
        `Key "method" is not present in the dataLayer`
      );
    });
  });
});
