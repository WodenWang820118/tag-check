import { LOCALE_ID } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {
  DeferBlockBehavior,
  DeferBlockState,
  TestBed,
  type ComponentFixture
} from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { MenuTabsComponent } from './menu-tabs.component';

const primaryLink = {
  href: '/zh-hant/documentation/introduction',
  label: 'Getting Started',
  icon: 'menu_book',
  logicalPath: '/documentation',
  matchStrategy: 'prefix'
} as const;

const docsLink = {
  href: 'https://tag-check-documentation.vercel.app/zh-hant/documentation/introduction',
  label: 'Docs',
  icon: 'menu_book'
} as const;

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
            path: ':locale/documentation/:name',
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
      '/zh-hant/documentation/introduction',
      'https://tag-check-documentation.vercel.app/zh-hant/documentation/introduction',
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
    await TestBed.inject(Router).navigateByUrl(
      '/zh-hant/documentation/introduction'
    );
    const fixture = renderMenu();

    expect(fixture.componentInstance.isLinkActive(primaryLink)).toBe(true);
    expect(
      fixture.componentInstance.isLinkActive({
        ...primaryLink,
        logicalPath: '/app',
        matchStrategy: 'exact'
      })
    ).toBe(false);
  });
});

describe('MenuTabsComponent mobile menu', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuTabsComponent],
      providers: [
        { provide: LOCALE_ID, useValue: 'zh-Hant' },
        provideNoopAnimations(),
        provideRouter([])
      ],
      deferBlockBehavior: DeferBlockBehavior.Manual
    }).compileComponents();
  });

  it('opens the menu clicked before it loaded once it loads', async () => {
    const fixture = renderMenu();
    const [deferBlock] = await fixture.getDeferBlocks();
    const placeholder = getHamburger(fixture);

    expect(placeholder.getAttribute('aria-haspopup')).toBe('menu');
    placeholder.click();
    await deferBlock.render(DeferBlockState.Complete);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(getHamburger(fixture).getAttribute('aria-expanded')).toBe('true');
    const items = Array.from(
      document.querySelectorAll('.mat-mdc-menu-panel a[mat-menu-item]')
    ).map((item) => item.getAttribute('href'));
    expect(items).toEqual([
      '/zh-hant/documentation/introduction',
      'https://tag-check-documentation.vercel.app/zh-hant/documentation/introduction',
      '/zh-hant/about',
      '/zh-hant/objectives',
      'https://github.com/WodenWang820118/tag-check'
    ]);
  });

  it('keeps the menu closed when it loads without a click', async () => {
    const fixture = renderMenu();
    const [deferBlock] = await fixture.getDeferBlocks();

    await deferBlock.render(DeferBlockState.Complete);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(getHamburger(fixture).getAttribute('aria-expanded')).toBe('false');
    expect(document.querySelector('.mat-mdc-menu-panel')).toBeNull();
  });
});

function getHamburger(
  fixture: ComponentFixture<MenuTabsComponent>
): HTMLButtonElement {
  const button = fixture.nativeElement.querySelector(
    'button.nav-hamburger'
  ) as HTMLButtonElement | null;
  if (!button) {
    throw new Error('The hamburger button is not rendered.');
  }
  return button;
}

function renderMenu(): ComponentFixture<MenuTabsComponent> {
  const fixture = TestBed.createComponent(MenuTabsComponent);
  fixture.componentRef.setInput('primaryLink', primaryLink);
  fixture.componentRef.setInput('docsLink', docsLink);
  fixture.detectChanges();
  return fixture;
}

function getInlineMenuLinks(
  fixture: ComponentFixture<MenuTabsComponent>
): HTMLAnchorElement[] {
  const links = Array.from(
    fixture.nativeElement.querySelectorAll('nav a')
  ) as HTMLAnchorElement[];

  expect(links).toHaveLength(5);

  return links;
}
