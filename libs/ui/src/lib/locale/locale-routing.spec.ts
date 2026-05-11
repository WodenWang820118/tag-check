import { describe, expect, it } from 'vitest';
import {
  buildLocalizedPath,
  getLocaleConfig,
  isIndexableLogicalRoute,
  stripLocalePrefix
} from './locale-routing';

describe('locale routing helpers', () => {
  it('normalizes Angular locale IDs into public locale config', () => {
    expect(getLocaleConfig('en').urlSegment).toBe('');
    expect(getLocaleConfig('zh-hant-TW').code).toBe('zh-Hant');
    expect(getLocaleConfig('zh_Hans_CN').code).toBe('zh-Hans');
    expect(getLocaleConfig('ja-JP').assetSegment).toBe('ja');
  });

  it('keeps English at root and prefixes non-English locales', () => {
    expect(buildLocalizedPath('/', 'en-US')).toBe('/');
    expect(buildLocalizedPath('/app', 'en-US')).toBe('/app');
    expect(buildLocalizedPath('/', 'zh-Hant')).toBe('/zh-hant/');
    expect(buildLocalizedPath('/about', 'ja')).toBe('/ja/about');
  });

  it('strips locale prefixes from routed paths', () => {
    expect(stripLocalePrefix('/zh-hans/objectives?section=goals')).toBe(
      '/objectives'
    );
    expect(stripLocalePrefix('/ja/')).toBe('/');
    expect(stripLocalePrefix('/app')).toBe('/app');
  });

  it('marks only public content routes as indexable', () => {
    expect(isIndexableLogicalRoute('/zh-hant/about')).toBe(true);
    expect(isIndexableLogicalRoute('/ja/objectives')).toBe(true);
    expect(isIndexableLogicalRoute('/zh-hans/app')).toBe(false);
  });
});
