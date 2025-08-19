import { Recording, Spec } from '@utils';

const recording: Recording = {
  title: 'add_shipping_info',
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
      offsetY: 109,
      offsetX: 213
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['main div > button']],
      offsetY: 10.28125,
      offsetX: 76.1875
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['button.relative']],
      offsetY: 8,
      offsetX: 43.71875
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['main span.p-button-label']],
      offsetY: 14,
      offsetX: 40.765625
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['main span']],
      offsetY: 10,
      offsetX: 41.953125
    }
  ]
};

const spec: Spec = {
  event: 'add_shipping_info',
  currency: '$currency',
  items: []
};

export const addShippingInfoExample = {
  eventName: 'add_shipping_info',
  testName: 'Standard Add Shipping Info Test',
  recording,
  spec
};
