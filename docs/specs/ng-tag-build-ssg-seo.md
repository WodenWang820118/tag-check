# ng-tag-build SSG SEO Contract

`ng-tag-build` uses Angular build-time i18n plus static prerendering for public,
indexable pages. English is served from the root path, and localized builds use
the configured `subPath` values: `zh-hant`, `zh-hans`, and `ja`.

Indexable routes are intentionally limited to:

- `/`
- `/about`
- `/objectives`

The editor route `/app` is client-heavy and intentionally excluded from
`sitemap.xml`. It must keep `noindex,follow` metadata so search engines can
follow links without treating the editor as the SEO entry page.

When adding another public SEO route, update these files in the same change:

- `apps/ng-tag-build/src/app/app.routes.ts`
- `apps/ng-tag-build/src/app/app.routes.server.ts`
- `apps/ng-tag-build/src/app/seo/seo.service.ts`
- `apps/ng-tag-build/src/prerender-routes.txt`
- `apps/ng-tag-build/src/sitemap.xml`
- `apps/ng-tag-build/src/locale/messages*.xlf`
- `tools/scripts/i18n/ng-tag-build-locales/*.ts`

Angular 21's `outputMode: "static"` derives prerendered pages from
`app.routes.server.ts`; `prerender-routes.txt` is kept as the human-readable
route inventory for this SEO contract.

Maintain curated landing, navigation, and SEO copy in one locale file per
language under `tools/scripts/i18n/ng-tag-build-locales/`.

Run `pnpm i18n:ng-tag-build` after adding or renaming custom i18n IDs so all
locale files keep the same `<trans-unit>` set.
