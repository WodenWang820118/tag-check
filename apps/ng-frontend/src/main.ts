import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import * as Sentry from '@sentry/angular';

type DiagnosticErrorCause = {
  operation?: unknown;
  method?: unknown;
  status?: unknown;
  url?: unknown;
  path?: unknown;
  requestId?: unknown;
};

// Initialize Sentry with minimal configuration
Sentry.init({
  dsn: 'https://a91fc0202870cb01de7a67884b3f0d45@o4507047390019584.ingest.us.sentry.io/4507892845838336',
  integrations: [], // Start with no integrations
  tracesSampleRate: 1.0,
  tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  defaultIntegrations: false,
  beforeSend(event, hint) {
    const httpDiagnostics = extractHttpDiagnostics(hint.originalException);
    if (httpDiagnostics) {
      event.contexts = {
        ...event.contexts,
        httpDiagnostics
      };
    }
    return event;
  }
});

function extractHttpDiagnostics(
  exception: unknown
): DiagnosticErrorCause | null {
  if (!(exception instanceof Error)) {
    return null;
  }

  const cause = exception.cause;
  if (!isDiagnosticErrorCause(cause)) {
    return null;
  }

  return Object.fromEntries(
    Object.entries(cause).filter(
      ([, value]) => typeof value === 'string' || typeof value === 'number'
    )
  ) as DiagnosticErrorCause;
}

function isDiagnosticErrorCause(cause: unknown): cause is DiagnosticErrorCause {
  return (
    typeof cause === 'object' &&
    cause !== null &&
    ('requestId' in cause || 'operation' in cause || 'status' in cause)
  );
}

/** Signal to the Tauri shell that the Angular app has finished bootstrapping. */
async function notifyAppReady(): Promise<void> {
  // Only emit when running inside a Tauri webview
  if (
    typeof globalThis !== 'undefined' &&
    '__TAURI_INTERNALS__' in globalThis
  ) {
    const { emit } = await import('@tauri-apps/api/event');
    await emit('app-ready');
    console.log('Tauri app-ready event emitted');
  }
}

/** Wait until Angular has had a chance to paint the first visible frame. */
function waitForFirstPaint(): Promise<void> {
  if (
    typeof globalThis === 'undefined' ||
    typeof globalThis.requestAnimationFrame !== 'function'
  ) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    globalThis.requestAnimationFrame(() => {
      globalThis.requestAnimationFrame(() => resolve());
    });
  });
}

// Bootstrap the application first
bootstrapApplication(AppComponent, appConfig)
  .then(async () => {
    console.log('Application bootstrapped successfully');

    // Wait for the first frame so the desktop splash only closes once the
    // Angular shell has something visible to hand off to.
    await waitForFirstPaint();

    // Notify Tauri that the app is ready (closes the splash screen)
    await notifyAppReady();

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
