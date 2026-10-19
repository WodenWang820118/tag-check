import { Recording } from '@utils';
import { exampleGtmJson } from '../gtm-json';
import { buildExampleEventSpec } from './helpers';

const VIEW_CART = 'view_cart';

const recording: Recording = {
  title: VIEW_CART,
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
    }
  ]
};

const spec = buildExampleEventSpec(exampleGtmJson, VIEW_CART);
const normalizedTag = spec.tag;

export const viewCartExample = {
  eventName: VIEW_CART,
  testName: normalizedTag.name,
  recording,
  spec
};
