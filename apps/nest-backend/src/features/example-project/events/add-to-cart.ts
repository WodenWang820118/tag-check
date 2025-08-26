import { ItemDef, Recording, Spec, TagConfig, TriggerConfig } from '@utils';
import { exampleGtmJson } from '../gtm-json';

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

const tag = exampleGtmJson.containerVersion.tag.find(
  (t) => t.parameter.find((p) => p.key === 'eventName')?.value === 'add_to_cart'
);
if (!tag) {
  throw new Error(
    'Tag with eventName "add_to_cart" not found in exampleGtmJson'
  );
}
const normalizedTag: TagConfig = tag;

const triggerNormalized = exampleGtmJson.containerVersion.trigger.find(
  (t) => t.triggerId && (tag.firingTriggerId || []).includes(t.triggerId)
) as unknown as TriggerConfig | undefined;

const spec: Spec = {
  tag: normalizedTag,
  trigger: triggerNormalized ? [triggerNormalized] : []
};

const fullItemDef: ItemDef = {
  templateName: 'Add to cart Info Items',
  itemId: 'add_to_cart',
  fullItemDef: {
    item_id: 'city001',
    item_name: 'Switzerland',
    item_list_name: 'destinations',
    item_category: 'Switzerland',
    quantity: 1,
    price: 799
  }
};

export const addToCartExample = {
  eventName: 'add_to_cart',
  testName: normalizedTag.name,
  recording,
  spec,
  fullItemDef
};
