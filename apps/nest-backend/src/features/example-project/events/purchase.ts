import { Recording, Spec } from '@utils';

const recording: Recording = {
  title: 'purchase',
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
      selectors: [['div.p-carousel-item-end img']],
      offsetY: 130,
      offsetX: 149
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['main div > button']],
      offsetY: 32.609375,
      offsetX: 54.1875
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['button.relative > span.p-button-label']],
      offsetY: 20,
      offsetX: 9.71875
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['main span.p-button-label']],
      offsetY: 17,
      offsetX: 41.765625
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['main span']],
      offsetY: 11,
      offsetX: 52.953125
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['main span']],
      offsetY: 7,
      offsetX: 59.953125
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['main button:nth-of-type(1) > span']],
      offsetY: 6,
      offsetX: 43.578125
    }
  ]
};

const spec: Spec = {
  event: 'purchase',
  ecommerce: {
    currency: 'USD',
    items: []
  }
};

export const purchaseExample = {
  eventName: 'purchase',
  testName: 'Standard Purchase Test',
  recording,
  spec
};
