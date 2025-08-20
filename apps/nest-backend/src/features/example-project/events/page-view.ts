import { Recording, Spec } from '@utils';

const pageViewRecording: Recording = {
  title: 'page_view',
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

const pageViewSpec: Spec = {
  event: 'page_view',
  pagePath: '$pagePath',
  pageTitle: '$pageTitle',
  pageUrl: '$pageUrl',
  pageReferrer: '$pageReferrer'
};

export const pageViewExample = {
  recording: pageViewRecording,
  spec: pageViewSpec,
  eventName: 'page_view',
  testName: 'Standard Page View'
};
