import { ItemDef, Recording, Spec, TagConfig, TriggerConfig } from '@utils';
import { exampleGtmJson } from '../gtm-json';

const EVENT_NAME = 'purchase';

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

const tag = exampleGtmJson.containerVersion.tag.find(
  (t) => t.parameter.find((p) => p.key === 'eventName')?.value === EVENT_NAME
);
if (!tag) {
  throw new Error(
    `Tag with eventName "${EVENT_NAME}" not found in exampleGtmJson`
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
  templateName: 'Purchase Info Items',
  itemId: 'purchase_info',
  fullItemDef: {
    item_id: 'city001',
    item_name: 'Switzerland',
    item_category: 'Switzerland',
    quantity: 1,
    price: 799
  }
};

export const purchaseExample = {
  eventName: EVENT_NAME,
  testName: normalizedTag.name,
  recording,
  spec,
  fullItemDef
};
