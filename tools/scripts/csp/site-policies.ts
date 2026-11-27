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

/**
 * Every directive a site policy may set, in the order the serialized policy
 * lists them. `CspDirective` is derived from this list, so a directive cannot
 * be allowed in a policy without also being written into it.
 */
export const CSP_DIRECTIVES = [
  'default-src',
  'script-src',
  'style-src',
  'font-src',
  'img-src',
  'connect-src',
  'frame-src',
  'media-src',
  'object-src',
  'base-uri',
  'form-action'
] as const;

export type CspDirective = (typeof CSP_DIRECTIVES)[number];

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
  },
  // Measured on the static build with the real GTM-K2LT6GM4 container. Google
  // sources follow https://developers.google.com/tag-platform/security/guides/csp.
  'ng-tag-build': {
    hashInlineScripts: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        // gtm.js (index.html snippet) and the gtag.js the container loads.
        'https://www.googletagmanager.com'
      ],
      'style-src': [
        "'self'",
        // Angular component styles, CodeMirror and mermaid add <style>
        // elements; the build inlines the Google Fonts stylesheets as <style>.
        "'unsafe-inline'"
      ],
      // Roboto and Material Icons files named by the inlined font stylesheets.
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': [
        "'self'",
        // CodeMirror editor theme backgrounds (data:image/svg+xml).
        'data:',
        // GTM and GA4 image requests.
        'https://www.googletagmanager.com',
        'https://*.google-analytics.com'
      ],
      'connect-src': [
        "'self'",
        // GA4 /g/collect hits sent by the container's Google tag.
        'https://*.google-analytics.com',
        'https://*.analytics.google.com',
        'https://*.googletagmanager.com'
      ],
      // The GTM <noscript> iframe (ns.html) in index.html.
      'frame-src': ['https://www.googletagmanager.com'],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"]
    }
  },
  // The sample shop hosts whatever GTM container is under test, including
  // Custom HTML tags and Tag Assistant, so scripts stay unrestricted.
  'ng-gtm-sample': {
    hashInlineScripts: false,
    directives: {
      'object-src': ["'none'"],
      'base-uri': ["'self'"]
    }
  }
} as const satisfies Record<string, SiteCspPolicy>;

export type SiteName = keyof typeof SITE_POLICIES;
