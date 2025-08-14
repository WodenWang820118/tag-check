import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import * as Sentry from '@sentry/angular';

// Initialize Sentry with minimal configuration
Sentry.init({
  dsn: 'https://a91fc0202870cb01de7a67884b3f0d45@o4507047390019584.ingest.us.sentry.io/4507892845838336',
  integrations: [], // Start with no integrations
  tracesSampleRate: 1.0,
  tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  defaultIntegrations: false
});

// Bootstrap the application first
bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    console.log('Application bootstrapped successfully');

    // Load integrations after bootstrap completes
    loadSentryIntegrations();
  })
  .catch((err) => console.error('Error bootstrapping application:', err));

// Function to load Sentry integrations
async function loadSentryIntegrations() {
  try {
    // Load integrations as needed using await to properly handle errors
    const replayIntegrationFactory =
      await Sentry.lazyLoadIntegration('replayIntegration');
    Sentry.addIntegration(replayIntegrationFactory());
  } catch (error) {
    console.error('Failed to load Sentry integrations:', error);
  }
}
