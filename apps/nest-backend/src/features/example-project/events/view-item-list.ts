import { Recording, Spec } from '@utils';

const recording: Recording = {
  title: 'view_item_list',
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
      selectors: [['#viewDestination span']],
      offsetY: 2,
      offsetX: 106.078125
    }
  ]
};

const spec: Spec = {
  event: 'view_item_list',
  currency: '$currency',
  items: []
};

export const viewItemListExample = {
  eventName: 'view_item_list',
  testName: 'Standard View Item List Test',
  recording,
  spec
};
