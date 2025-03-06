export const exampleRecording = {
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
      url: 'https://gtm-integration-sample.netlify.app',
      assertedEvents: [
        {
          type: 'navigation',
          url: 'https://gtm-integration-sample.netlify.app/home',
          title: 'Ng GTM Integration App'
        }
      ]
    }
  ]
};
