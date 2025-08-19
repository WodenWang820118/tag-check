import { Recording, Spec } from '@utils';

const recording: Recording = {
  title: 'app_payment_info',
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
      offsetY: 108,
      offsetX: 166
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['main div > button']],
      offsetY: 20.28125,
      offsetX: 72.1875
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['main span.p-button-label']],
      offsetY: 8.5,
      offsetX: 18.765625
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['main span']],
      offsetY: 16,
      offsetX: 51.953125
    }
  ]
};

const spec: Spec = {
  event: 'app_payment_info',
  currency: '$currency',
  items: []
};

export const addPaymentInfoExample = {
  eventName: 'app_payment_info',
  testName: 'Standard Add Payment Info Test',
  recording,
  spec
};
