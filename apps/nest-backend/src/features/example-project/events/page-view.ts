import { Recording, Spec, TagConfig, TriggerConfig } from '@utils';
import { exampleGtmJson } from '../gtm-json';

const EVENT_NAME = 'page_view';

const pageViewRecording: Recording = {
  title: EVENT_NAME,
  steps: [
    {
      type: 'setViewport',
      width: 866,
      height: 729,
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
    }
  ]
};

const tag = exampleGtmJson.containerVersion.tag.find(
  (t) => t.parameter.find((p) => p.key === 'eventName')?.value === EVENT_NAME
);
if (!tag) {
  throw new Error('Tag with eventName "page_view" not found in exampleGtmJson');
}
const normalizedTag: TagConfig = tag;

const triggerNormalized = exampleGtmJson.containerVersion.trigger.find(
  (t) => t.triggerId && (tag.firingTriggerId || []).includes(t.triggerId)
) as unknown as TriggerConfig | undefined;

const spec: Spec = {
  tag: normalizedTag,
  trigger: triggerNormalized ? [triggerNormalized] : []
};

export const pageViewExample = {
  eventName: EVENT_NAME,
  recording: pageViewRecording,
  spec,
  testName: normalizedTag.name
};
