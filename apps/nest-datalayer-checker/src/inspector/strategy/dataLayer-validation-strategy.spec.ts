import {
  BaseDataLayerEvent,
  StrictDataLayerEvent,
} from '../../shared/interfaces/data-layer.interface';
import {
  EcommerceEventValidationStrategy,
  OldGA4EventsValidationStrategy,
  ValidationStrategy,
} from './dataLayer-validation-strategy'; // <- Change this to the actual import location

describe('EcommerceEventValidationStrategy', () => {
  let strategy: ValidationStrategy;

  beforeEach(() => {
    strategy = new EcommerceEventValidationStrategy();
  });

  const tests: {
    description: string;
    dataLayer: BaseDataLayerEvent[] | StrictDataLayerEvent[];
    spec: StrictDataLayerEvent;
    expectedResult: {
      passed: boolean;
      message: string;
    };
  }[] = [
    {
      description: 'should pass for add_to_cart event with all required keys',
      dataLayer: [
        { ecommerce: null },
        {
          event: 'add_to_cart',
          ecommerce: {
            items: [
              {
                item_id: 'SKU_12345',
                item_name: 'Laptop',
              },
            ],
          },
        },
      ],
      spec: {
        event: 'add_to_cart',
        ecommerce: {
          items: [
            {
              item_id: 'SKU_12345',
              item_name: 'Laptop',
            },
          ],
        },
      },
      expectedResult: {
        passed: true,
        message: 'Valid',
      },
    },
    {
      description: 'should pass for view_item event with all required keys',
      dataLayer: [
        { ecommerce: null },
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
      ],
      spec: {
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
      expectedResult: {
        passed: true,
        message: 'Valid',
      },
    },
    // ... more test cases
  ];

  it.each(tests)('$description', ({ dataLayer, spec, expectedResult }) => {
    const result = strategy.validateDataLayer(dataLayer, spec);
    expect(result.passed).toBe(expectedResult.passed);
    expect(result.message).toBe(expectedResult.message);
  });

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
    expect(result.message).toBe('ecommerce not reset');
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
    expect(result.message).toBe('Missing keys');
    expect(result.incorrectInfo).toEqual(['method']);
  });
});
