import { ItemDef, Recording } from '@utils';
import { exampleGtmJson } from '../gtm-json';
import { buildExampleEventSpec } from './helpers';

const recording: Recording = {
  title: 'begin_checkout',
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
      selectors: [['div:nth-of-type(9) img']],
      offsetY: 90,
      offsetX: 143.0498046875
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['main div > button']],
      offsetY: 19.828125,
      offsetX: 62.1875
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['button.relative > span.p-button-label']],
      offsetY: 11,
      offsetX: 8.71875
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['tfoot button']],
      offsetY: 35,
      offsetX: 80.796875
    }
  ]
};

const spec = buildExampleEventSpec(exampleGtmJson, 'begin_checkout');
const normalizedTag = spec.tag;

const fullItemDef: ItemDef = {
  templateName: 'Begin Checkout Info Items',
  itemId: 'begin_checkout',
  fullItemDef: {
    item_id: 'city001',
    item_name: 'Switzerland',
    item_category: 'Switzerland',
    quantity: 1,
    price: 799
  }
};

export const beginCheckoutExample = {
  eventName: 'begin_checkout',
  testName: normalizedTag.name,
  recording,
  spec,
  fullItemDef
};
