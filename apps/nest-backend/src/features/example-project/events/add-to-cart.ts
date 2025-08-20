import { Recording, Spec } from '@utils';

const recording: Recording = {
  title: 'add_to_cart',
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
      offsetY: 134,
      offsetX: 69
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['main div > button']],
      offsetY: 23.609375,
      offsetX: 46.1875
    }
  ]
};

const spec: Spec = {
  event: 'add_to_cart',
  ecommerce: {
    currency: 'USD',
    items: []
  }
};

export const addToCartExample = {
  eventName: 'add_to_cart',
  testName: 'Standard Add to Cart Test',
  recording,
  spec
};
