import { Recording, Spec } from '@utils';

const recording: Recording = {
  title: 'view_item',
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
      offsetY: 111,
      offsetX: 191
    }
  ]
};

const spec: Spec = {
  event: 'view_promotion',
  ecommerce: {
    creative_name: '$creativeName',
    creative_slot: '$creativeSlot',
    promotion_id: '$promotionId',
    promotion_name: '$promotionName',
    items: [
      {
        item_id: 'city003',
        item_name: 'Providence',
        item_category: 'Providence',
        price: 799,
        quantity: 1
      }
    ]
  }
};

export const viewPromotionExample = {
  recording,
  spec,
  eventName: 'view_promotion',
  testName: 'Standard View Promotion'
};
