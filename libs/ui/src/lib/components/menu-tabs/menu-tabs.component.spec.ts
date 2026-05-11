import { LOCALE_ID } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { MenuTabsComponent } from './menu-tabs.component';

describe('MenuTabsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuTabsComponent],
      providers: [
        { provide: LOCALE_ID, useValue: 'zh-Hant' },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        provideRouter([
          {
            path: ':locale/about',
            children: []
          }
        ])
      ]
    }).compileComponents();
  });

  it('creates localized primary navigation links', () => {
    const fixture = renderMenu();
    const links = getInlineMenuLinks(fixture);

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/zh-hant/app',
      '/zh-hant/about',
      '/zh-hant/objectives',
      'https://github.com/WodenWang820118/tag-check'
    ]);
    expect(links.at(-1)?.getAttribute('target')).toBe('_blank');
    expect(links.at(-1)?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('keeps about and objectives visible by default', () => {
    const fixture = renderMenu();

    expect(fixture.componentInstance.aboutDisabled()).toBe(false);
    expect(fixture.componentInstance.objectivesDisabled()).toBe(false);
  });

  it('marks the active tab from the logical route without the locale prefix', async () => {
    await TestBed.inject(Router).navigateByUrl('/zh-hant/about');
    const fixture = renderMenu();

    expect(fixture.componentInstance.isActive('/about')).toBe(true);
    expect(fixture.componentInstance.isActive('/app')).toBe(false);
  });
});

function renderMenu(): ComponentFixture<MenuTabsComponent> {
  const fixture = TestBed.createComponent(MenuTabsComponent);
  fixture.detectChanges();
  return fixture;
}

function getInlineMenuLinks(
  fixture: ComponentFixture<MenuTabsComponent>
): HTMLAnchorElement[] {
  const links = Array.from(
    fixture.nativeElement.querySelectorAll('nav a')
  ) as HTMLAnchorElement[];

  expect(links).toHaveLength(4);

  return links;
}
