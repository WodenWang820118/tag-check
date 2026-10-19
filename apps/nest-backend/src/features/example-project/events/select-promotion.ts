import { ItemDef, Recording } from '@utils';
import { exampleGtmJson } from '../gtm-json';
import { buildExampleEventSpec } from './helpers';

const EVENT_NAME = 'select_promotion';

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
    }
  ]
};

const spec = buildExampleEventSpec(exampleGtmJson, EVENT_NAME);
const normalizedTag = spec.tag;

const fullItemDef: ItemDef = {
  templateName: 'Select Promotion Info Items',
  itemId: 'select_promotion',
  fullItemDef: {
    item_id: 'city001',
    item_name: 'Switzerland'
  }
};

export const selectPromotionExample = {
  eventName: EVENT_NAME,
  testName: normalizedTag.name,
  recording,
  spec,
  fullItemDef
};
