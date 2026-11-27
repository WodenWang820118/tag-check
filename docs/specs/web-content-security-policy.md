# Content Security Policy for the public web sites

- **Status:** Accepted
- **Last Updated:** 2026-11-27
- **Related Issues:** #629, pull request #630

The four sites deployed to Vercel sent no Content Security Policy and no
other security headers. This record states what each site sends now, why it
is delivered the way it is, and how to change it.

## What each site sends

| Site                             | Page policy (`<meta>`)                                        | Response headers |
| -------------------------------- | ------------------------------------------------------------- | ---------------- |
| `ng-product-doc` (documentation) | strict: scripts from the site, Google Tag Manager and by hash | shared           |
| `ng-tag-build`                   | strict, same shape                                            | shared           |
| `ng-gtm-sample`                  | light: `object-src 'none'; base-uri 'self'`                   | shared           |
| Storybook (`ng-frontend`)        | none                                                          | shared           |

The page policies are defined in
[`tools/scripts/csp/site-policies.ts`](../../tools/scripts/csp/site-policies.ts),
one entry per site, with a comment next to each source naming what needs it.
The shared headers are in the root [`vercel.json`](../../vercel.json), which
applies to all four Vercel projects (each has Root Directory `.`).

The desktop application has its own policy in
`apps/desktop-tauri/src-tauri/tauri.conf.json`. Responses of the Nest backend
are out of scope.

## Decisions

### The page policy is a `<meta>` written after the build

A post-build step
([`apply-site-csp.ts`](../../tools/scripts/csp/apply-site-csp.ts)) writes
`<meta http-equiv="Content-Security-Policy">` into every built HTML page,
directly after the charset. The policy is then the same on Vercel production,
on preview URLs and on a local static server, and does not depend on settings
in the Vercel dashboard.

Angular's `security.autoCsp` was evaluated first and cannot be used: the
builder stops with "Cannot set both SSR and auto-CSP at the same time", and
these sites are prerendered through the SSR builder.

### Inline scripts are allowed by hash, never by `'unsafe-inline'`

The step hashes every executable inline script of each page (the tag manager
snippet, Angular's event replay script) and adds the hashes to `script-src`.
It hashes the text as the browser parses it: CRLF and lone CR become LF.

A hash cannot allow an inline event handler or a `javascript:` URL, so the
step refuses a page that has one when the site's policy restricts inline
script. Two build settings follow from this on the strict sites:

- `optimization.styles.inlineCritical` is `false`. Inline critical CSS loads
  the full stylesheet through an `onload` attribute.
- `ng-tag-build`'s Google Fonts links are plain stylesheets. The earlier
  preload links switched `rel` in an `onload` attribute. The build inlines
  the font stylesheets, so the pages request only font files from
  `fonts.gstatic.com`.

### `style-src` keeps `'unsafe-inline'`

Angular component styles, CodeMirror and mermaid add `<style>` elements at
run time, and static hosting has no per-response nonce. The desktop policy
makes the same choice.

### No script exception for tag manager Custom HTML on the strict sites

The strict sites allow `https://www.googletagmanager.com` as a script source
and nothing else from outside. A Custom HTML tag or a Custom JavaScript
variable in their containers would be blocked. Neither container uses one
today. If one is needed, decide then, with the measurement that shows it.

### The sample site does not restrict scripts

`ng-gtm-sample` exists to host whatever tag manager container is under test,
including Custom HTML tags and Tag Assistant. Its page policy sets only
`object-src 'none'` and `base-uri 'self'`.

The sample has an Angular service worker, whose `ngsw.json` holds a hash of
every page. `ng-gtm-sample:build-static` therefore regenerates `ngsw.json`
after the policy is written; with a stale hash the service worker refuses the
page.

### Shared headers hold what a `<meta>` cannot carry

| Header                    | Value                                                           | Reason                                                                                                                                                                                                                       |
| ------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Content-Security-Policy` | `frame-ancestors 'self'`                                        | Browsers ignore `frame-ancestors` in a `<meta>`. `'self'` and not `'none'`: Storybook's manager frames its own `iframe.html`. Tag Assistant opens the site in a new window or tab, not in a frame ([Google][preview]).       |
| `X-Content-Type-Options`  | `nosniff`                                                       |                                                                                                                                                                                                                              |
| `Referrer-Policy`         | `strict-origin-when-cross-origin`                               | GA4 reads the referring site from the document referrer ([Google][referrer]). This value still sends the origin to other sites; `no-referrer` or `same-origin` would turn referrals between these sites into direct traffic. |
| `Permissions-Policy`      | denies camera, microphone, geolocation, payment and device APIs | None of the four sites uses them. Clipboard, fullscreen and what the YouTube embed asks for (autoplay, encrypted media, picture-in-picture and others) are not listed, so they keep their defaults.                          |

The header policy must contain `frame-ancestors` only. A browser enforces
every policy it receives, so a fetch directive in the header would intersect
with each site's page policy; on the sample site and on Storybook it would
restrict scripts that are meant to be unrestricted.
`tools/scripts/csp/vercel-headers.spec.ts` fails if another directive is
added.

If one site ever needs a different value, a `has` condition on the `host` in
`vercel.json` can scope a rule to it.

### Scripts the sites load are served by the sites

`ngx-scrollbar` loads a scroll-timeline polyfill from a CDN in browsers
without scroll-driven animations. The documentation site serves the package's
own copy from its assets instead (`provideScrollbarPolyfill` in
`apps/ng-product-doc/src/app/app.config.ts`).

## Verification

A `<meta>` policy has no report-only mode. The check in
[`tools/scripts/csp-check`](../../tools/scripts/csp-check) takes its place:
it opens every page of a built directory, or of a deployed site by its
sitemap, in Chromium and fails on any `securitypolicyviolation` event, on a
page that does not load, and on a page without a policy.

```bash
pnpm nx run ng-product-doc:csp-check
pnpm nx run ng-tag-build:csp-check
pnpm nx run ng-gtm-sample:csp-check
node tools/scripts/csp-check/check-site-csp.ts --url <site origin>
```

The Nx targets build the site and block requests to other origins, so they
need no network. Run the check without `--block-external` on a few pages, or
with `--url` against the deployed site, to load the real tag manager
container.

Limits:

- The check loads pages; it does not click. A feature that fetches from a new
  origin only after an interaction needs its own run.
- It runs in Chromium. A script that only another browser loads (a polyfill,
  for one) is not seen.
- Pull request previews are behind Vercel Authentication, so the check
  against the deployed sites runs on production, after a change reaches
  `main`.
- The check is not part of CI.

## Changing a policy

- **Allow a new origin:** add it to the directive in `SITE_POLICIES` with a
  comment naming the file or feature that needs it, then run the site's
  `csp-check` target.
- **Add a directive:** add it to `CSP_DIRECTIVES` in `site-policies.ts`.
  `CspDirective` is derived from that list, which is also the order the
  policy is written in.
- **Add a site:** add its entry to `SITE_POLICIES`, give its project a
  `build-static` target that runs `apply-site-csp.ts` after the build and
  lists `tools/scripts/csp/*.ts` in its cache inputs, point the site's Vercel
  build script at that target, and add a `csp-check` target.

[preview]: https://support.google.com/tagmanager/answer/6107056
[referrer]: https://support.google.com/analytics/answer/11242841
