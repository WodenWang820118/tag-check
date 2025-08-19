import { Recording, Spec } from '@utils';

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
      selectors: [['div:nth-of-type(5) img']],
      offsetY: 43,
      offsetX: 141
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['main div > button']],
      offsetY: 26.921875,
      offsetX: 71.6875
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['button.relative > span.p-button-label']],
      offsetY: 12,
      offsetX: 17.71875
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['main span.p-button-label']],
      offsetY: 13.109375,
      offsetX: 40.765625
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['main button']],
      offsetY: 24,
      offsetX: 86.953125
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['main span']],
      offsetY: 10,
      offsetX: 84.453125
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['main button:nth-of-type(2)']],
      offsetY: 28,
      offsetX: 112.609375
    }
  ]
};

const spec: Spec = {
  event: 'refund',
  ecommerce: {
    currency: '$currency',
    items: []
  }
};

export const refundExample = {
  eventName: 'refund',
  testName: 'Standard Refund Test',
  recording,
  spec
};
