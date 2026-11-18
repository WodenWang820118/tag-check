/**
 * Content Security Policy definitions for static sites.
 *
 * Policies are delivered as `<meta http-equiv="Content-Security-Policy">` tags
 * inside each built HTML page so the exact same policy applies across Vercel
 * production, preview URLs, and local static servers without per-host header
 * drift. Directives that `<meta>` ignores (`frame-ancestors`, `report-uri`,
 * `report-to`, `sandbox`) belong in host/edge response headers instead.
 *
 * Angular's own `security.autoCsp` build option is not used: the builder
 * refuses it for a prerendered site ("Cannot set both SSR and auto-CSP at the
 * same time"), and these sites are prerendered.
 */

export type CspDirective =
  | 'default-src'
  | 'script-src'
  | 'style-src'
  | 'font-src'
  | 'img-src'
  | 'connect-src'
  | 'frame-src'
  | 'media-src'
  | 'object-src'
  | 'base-uri'
  | 'form-action';

export interface SiteCspPolicy {
  readonly hashInlineScripts: boolean;
  readonly directives: Readonly<
    Partial<Record<CspDirective, readonly string[]>>
  >;
}

export const SITE_POLICIES = {
  'ng-product-doc': {
    hashInlineScripts: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", 'https://www.googletagmanager.com'],
      'style-src': [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com'
      ],
      'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
      'img-src': [
        "'self'",
        'data:',
        'https://www.googletagmanager.com',
        'https://*.google-analytics.com'
      ],
      'connect-src': [
        "'self'",
        'https://*.google-analytics.com',
        'https://*.analytics.google.com',
        'https://*.googletagmanager.com'
      ],
      'frame-src': ['https://www.googletagmanager.com'],
      'media-src': ["'self'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"]
    }
  }
} as const satisfies Record<string, SiteCspPolicy>;

export type SiteName = keyof typeof SITE_POLICIES;
