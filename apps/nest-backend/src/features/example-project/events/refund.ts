import { Recording } from '@utils';
import { exampleGtmJson } from '../gtm-json';
import { buildExampleEventSpec } from './helpers';

const recording: Recording = {
  title: 'refund',
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
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['[data-testid="cancel-order"]']],
      offsetY: 18,
      offsetX: 63
    }
  ]
};

const spec = buildExampleEventSpec(exampleGtmJson, 'refund');
const normalizedTag = spec.tag;

export const refundExample = {
  eventName: 'refund',
  testName: normalizedTag.name,
  recording,
  spec
};
