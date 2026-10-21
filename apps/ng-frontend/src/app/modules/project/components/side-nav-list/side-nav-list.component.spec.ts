import { describe, expect, it } from 'vitest';
import { navSectionOf } from './side-nav-list.component';

describe('navSectionOf', () => {
  it('highlights Tests on the tests list and on a test page', () => {
    expect(navSectionOf('/projects/shop')).toBe('tests');
    expect(navSectionOf('/projects/shop/')).toBe('tests');
    expect(
      navSectionOf('/projects/shop/0fd9ce76-5792-4191-8fba-8bb20e3013bc?tab=1')
    ).toBe('tests');
  });

  it('highlights the section a page belongs to', () => {
    expect(navSectionOf('/projects/shop/tag-build')).toBe('tagbuild');
    expect(navSectionOf('/projects/shop/buckets')).toBe('reports');
    expect(navSectionOf('/projects/shop/settings/gtm')).toBe('settings');
    expect(navSectionOf('/projects/shop/settings/project-io#top')).toBe(
      'settings'
    );
  });
});
