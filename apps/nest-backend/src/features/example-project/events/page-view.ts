import { Recording } from '@utils';
import { exampleGtmJson } from '../gtm-json';
import { buildExampleEventSpec } from './helpers';

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

const spec = buildExampleEventSpec(exampleGtmJson, EVENT_NAME);
const normalizedTag = spec.tag;

export const pageViewExample = {
  eventName: EVENT_NAME,
  recording: pageViewRecording,
  spec,
  testName: normalizedTag.name
};
