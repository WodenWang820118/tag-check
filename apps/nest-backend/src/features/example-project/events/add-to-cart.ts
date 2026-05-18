import { ItemDef, Recording } from '@utils';
import { exampleGtmJson } from '../gtm-json';
import { buildExampleEventSpec } from './helpers';

const recording: Recording = {
  title: 'add_to_cart',
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
          title: 'Ng GTM Integration App'
        }
      ]
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['div.p-carousel-item-end img']],
      offsetY: 134,
      offsetX: 69
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['main div > button']],
      offsetY: 23.609375,
      offsetX: 46.1875
    }
  ]
};

const spec = buildExampleEventSpec(exampleGtmJson, 'add_to_cart');
const normalizedTag = spec.tag;

const fullItemDef: ItemDef = {
  templateName: 'Add to cart Info Items',
  itemId: 'add_to_cart',
  fullItemDef: {
    item_id: 'city001',
    item_name: 'Switzerland',
    item_list_name: 'destinations',
    item_category: 'Switzerland',
    quantity: 1,
    price: 799
  }
};

export const addToCartExample = {
  eventName: 'add_to_cart',
  testName: normalizedTag.name,
  recording,
  spec,
  fullItemDef
};
