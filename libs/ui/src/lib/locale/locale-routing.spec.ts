import { describe, expect, it } from 'vitest';
import {
  SUPPORTED_LOCALES,
  buildLocalizedPath,
  getLocaleConfig,
  getLocaleFromPathname,
  isIndexableLogicalRoute,
  getLogicalPath,
  stripLocalePrefix
} from './locale-routing';

describe('locale routing helpers', () => {
  it('normalizes Angular locale IDs into public locale config', () => {
    expect(getLocaleConfig('en').urlSegment).toBe('en');
    expect(getLocaleConfig('zh-hant-TW').code).toBe('zh-Hant');
    expect(getLocaleConfig('zh_Hans_CN').code).toBe('zh-Hans');
    expect(getLocaleConfig('ja-JP').assetSegment).toBe('ja');
    expect(getLocaleConfig('fr-FR').code).toBe('en-US');
  });

  it('uses explicit locale prefixes for every locale', () => {
    expect(buildLocalizedPath('/', 'en-US')).toBe('/en/');
    expect(buildLocalizedPath('/app', 'en-US')).toBe('/en/app');
    expect(buildLocalizedPath('/', 'zh-Hant')).toBe('/zh-hant/');
    expect(buildLocalizedPath('/about', 'ja')).toBe('/ja/about');
  });

  it.each(
    SUPPORTED_LOCALES.map((locale) => [locale.code, locale.urlSegment] as const)
  )('builds localized documentation paths for %s', (localeCode, urlSegment) => {
    expect(
      buildLocalizedPath('/documentation/getting-started', localeCode)
    ).toBe(`/${urlSegment}/documentation/getting-started`);
  });

  it('strips locale prefixes from routed paths', () => {
    expect(stripLocalePrefix('/zh-hans/objectives?section=goals')).toBe(
      '/objectives'
    );
    expect(stripLocalePrefix('/ja/')).toBe('/');
    expect(stripLocalePrefix('/app')).toBe('/app');
  });

  it('reads locale and logical path from a localized URL', () => {
    expect(getLocaleFromPathname('/ja/documentation/introduction').code).toBe(
      'ja'
    );
    expect(getLocaleFromPathname('/documentation/introduction').code).toBe(
      'en-US'
    );
    expect(getLogicalPath('/en/about')).toBe('/about');
  });

  it.each(
    SUPPORTED_LOCALES.map((locale) => [locale.urlSegment, locale.code] as const)
  )(
    'detects the %s locale prefix from the pathname',
    (urlSegment, localeCode) => {
      expect(getLocaleFromPathname(`/${urlSegment}/about`).code).toBe(
        localeCode
      );
      expect(getLogicalPath(`/${urlSegment}/documentation/objective`)).toBe(
        '/documentation/objective'
      );
    }
  );

  it('marks only public content routes as indexable', () => {
    expect(isIndexableLogicalRoute('/zh-hant/about')).toBe(true);
    expect(isIndexableLogicalRoute('/ja/objectives')).toBe(true);
    expect(
      isIndexableLogicalRoute('/zh-hans/documentation/getting-started')
    ).toBe(true);
    expect(isIndexableLogicalRoute('/zh-hans/app')).toBe(false);
  });
});
