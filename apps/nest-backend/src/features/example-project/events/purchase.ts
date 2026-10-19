import { ItemDef, Recording } from '@utils';
import { exampleGtmJson } from '../gtm-json';
import { buildExampleEventSpec } from './helpers';

const EVENT_NAME = 'purchase';

const recording: Recording = {
  title: EVENT_NAME,
  steps: [
    {
      type: 'setViewport',
      width: 1404,
      height: 945,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      isLandscape: false
    },
    {
      type: 'navigate',
      url: 'https://ng-gtm-sample.vercel.app/home',
      assertedEvents: [
        {
          type: 'navigation',
          url: 'https://ng-gtm-sample.vercel.app/home',
          title: 'Travel With GTM | Demo Travel Catalog'
        }
      ]
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['[data-testid="promotion-dot-city001"]']],
      offsetY: 3,
      offsetX: 16
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['[data-testid="promotion-explore-city001"]']],
      offsetY: 18,
      offsetX: 69
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['[data-testid="add-to-cart"]']],
      offsetY: 18,
      offsetX: 58
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['[data-testid="nav-cart"]']],
      offsetY: 20,
      offsetX: 41
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['[data-testid="begin-checkout"]']],
      offsetY: 18,
      offsetX: 51
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['[data-testid="shipping-continue"]']],
      offsetY: 18,
      offsetX: 39
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['[data-testid="place-order"]']],
      offsetY: 18,
      offsetX: 58
    }
  ]
};

const spec = buildExampleEventSpec(exampleGtmJson, EVENT_NAME);
const normalizedTag = spec.tag;

const fullItemDef: ItemDef = {
  templateName: 'Purchase Info Items',
  itemId: 'purchase_info',
  fullItemDef: {
    item_id: 'city001',
    item_name: 'Switzerland',
    item_category: 'Switzerland',
    quantity: 1,
    price: 799
  }
};

export const purchaseExample = {
  eventName: EVENT_NAME,
  testName: normalizedTag.name,
  recording,
  spec,
  fullItemDef
};
