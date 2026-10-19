import { Recording } from '@utils';
import { exampleGtmJson } from '../gtm-json';
import { buildExampleEventSpec } from './helpers';

const EVENT_NAME = 'view_promotion';

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
    }
  ]
};

const spec = buildExampleEventSpec(exampleGtmJson, EVENT_NAME);
const normalizedTag = spec.tag;

export const viewPromotionExample = {
  eventName: EVENT_NAME,
  recording,
  spec,
  testName: normalizedTag.name
};
