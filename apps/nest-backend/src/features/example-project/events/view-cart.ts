import { Recording, Spec, TagConfig, TriggerConfig } from '@utils';
import { exampleGtmJson } from '../gtm-json';

const VIEW_CART = 'view_cart';

const recording: Recording = {
  title: VIEW_CART,
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
      offsetY: 116,
      offsetX: 199.676025390625
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['main div > button']],
      offsetY: 13.28125,
      offsetX: 75.1875
    },
    {
      type: 'click',
      target: 'main',
      selectors: [['button.relative']],
      offsetY: 15,
      offsetX: 31.71875
    }
  ]
};

const tag = exampleGtmJson.containerVersion.tag.find(
  (t) => t.parameter.find((p) => p.key === 'eventName')?.value === VIEW_CART
);
if (!tag) {
  throw new Error(
    `Tag with eventName "${VIEW_CART}" not found in exampleGtmJson`
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

export const viewCartExample = {
  eventName: VIEW_CART,
  testName: normalizedTag.name,
  recording,
  spec
};
