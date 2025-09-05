import { ItemDef, Recording, Spec, TagConfig, TriggerConfig } from '@utils';
import { exampleGtmJson } from '../gtm-json';

const EVENT_NAME = 'add_shipping_info';

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

const tag = exampleGtmJson.containerVersion.tag.find(
  (t) => t.parameter.find((p) => p.key === 'eventName')?.value === EVENT_NAME
);
if (!tag) {
  throw new Error(
    'Tag with eventName "add_shipping_info" not found in exampleGtmJson'
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
  templateName: 'Shipping Info Items',
  itemId: 'shipping_info',
  fullItemDef: {
    item_id: 'city001',
    item_name: 'Switzerland',
    item_category: 'Switzerland',
    quantity: 1,
    price: 799
  }
};

export const addShippingInfoExample = {
  eventName: EVENT_NAME,
  testName: normalizedTag.name,
  recording,
  spec,
  fullItemDef
};
