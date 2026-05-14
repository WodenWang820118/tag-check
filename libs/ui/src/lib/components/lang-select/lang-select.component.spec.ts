import { describe, expect, it } from 'vitest';
import { LangSelectComponent } from './lang-select.component';

describe('LangSelectComponent', () => {
  it('initializes from the Angular build locale token', () => {
    const component = new LangSelectComponent(
      'zh-Hant',
      createDocument('/zh-hant/about'),
      serverPlatformId
    );

    expect(component.selectedLocale).toBe('zh-Hant');
    expect(component.selectedLangLabel).toBe('Traditional Chinese');
  });

  it('redirects to the same logical route when changing locales in the browser', () => {
    const document = createDocument('/zh-hant/about', '?tab=seo', '#diagram');
    const component = new LangSelectComponent(
      'zh-Hant',
      document,
      browserPlatformId
    );

    component.changeLocale('ja');

    expect(component.selectedLocale).toBe('ja');
    expect(document.location.href).toBe('/ja/about?tab=seo#diagram');
  });

  it('does not navigate while rendering outside the browser', () => {
    const document = createDocument('/zh-hans/objectives');
    const component = new LangSelectComponent(
      'zh-Hans',
      document,
      serverPlatformId
    );

    component.changeLocale('en-US');

    expect(component.selectedLocale).toBe('en-US');
    expect(document.location.href).toBe('');
  });
});

function createDocument(pathname: string, search = '', hash = ''): Document {
  return {
    location: {
      pathname,
      search,
      hash,
      href: ''
    }
  } as unknown as Document;
}

const browserPlatformId = 'browser' as unknown as object;
const serverPlatformId = 'server' as unknown as object;
