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
      url: 'https://ng-gtm-integration-sample.vercel.app/home',
      assertedEvents: [
        {
          type: 'navigation',
          url: 'https://ng-gtm-integration-sample.vercel.app/home',
          title: 'Ng GTM Integration App'
        }
      ]
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['div:nth-of-type(8) img']],
      offsetY: 116,
      offsetX: 199.676025390625
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['main div > button']],
      offsetY: 13.28125,
      offsetX: 75.1875
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['button.relative']],
      offsetY: 15,
      offsetX: 31.71875
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
